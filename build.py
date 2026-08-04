#!/usr/bin/env python3
import os
import sys
import subprocess
import re
from datetime import datetime

# Try to load standard markdown library; if missing, silently use the high-performance built-in parser.
HAS_MARKDOWN_PKG = False
try:
    import markdown
    HAS_MARKDOWN_PKG = True
except ImportError:
    pass

# Built-in lightweight Markdown to HTML parser
def parse_inline_styles(text):
    # Bold: **text** -> <b>text</b>
    text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', text)
    # Italics: *text* -> <i>text</i>
    text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
    # Italics: _text_ -> <i>text</i>
    text = re.sub(r'_(.*?)_', r'<i>\1</i>', text)
    # Code: `code` -> <code>code</code>
    text = re.sub(r'`(.*?)`', r'<code>\1</code>', text)
    # Links: [text](url) -> <a href="url">text</a>
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', text)
    return text

def parse_markdown_fallback(text):
    lines = text.split('\n')
    html_lines = []
    in_list = False
    in_ordered_list = False
    in_blockquote = False
    in_paragraph = False
    
    for line in lines:
        line_raw = line.rstrip('\r\n')
        stripped = line_raw.strip()
        
        # Handle empty lines (ends lists, blockquotes, paragraphs)
        if not stripped:
            if in_list:
                html_lines.append("            </ul>")
                in_list = False
            if in_ordered_list:
                html_lines.append("            </ol>")
                in_ordered_list = False
            if in_blockquote:
                html_lines.append("            </blockquote>")
                in_blockquote = False
            if in_paragraph:
                html_lines.append("            </p>")
                in_paragraph = False
            continue
            
        # Headers
        if stripped.startswith("### "):
            # close open elements
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            html_lines.append(f"            <h3>{parse_inline_styles(stripped[4:])}</h3>")
            continue
        elif stripped.startswith("## "):
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            html_lines.append(f"            <h2>{parse_inline_styles(stripped[3:])}</h2>")
            continue
        elif stripped.startswith("# "):
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            html_lines.append(f"            <h1>{parse_inline_styles(stripped[2:])}</h1>")
            continue
            
        # Blockquotes
        if stripped.startswith("> "):
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            if not in_blockquote:
                html_lines.append("            <blockquote>")
                in_blockquote = True
            content = stripped[2:]
            html_lines.append(f"                <p>{parse_inline_styles(content)}</p>")
            continue
            
        # Bullet Lists
        if stripped.startswith("* ") or stripped.startswith("- "):
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            if not in_list:
                html_lines.append("            <ul>")
                in_list = True
            content = stripped[2:]
            html_lines.append(f"                <li>{parse_inline_styles(content)}</li>")
            continue
            
        # Ordered Lists
        is_ol = False
        if len(stripped) > 2 and stripped[0].isdigit():
            idx = 0
            while idx < len(stripped) and stripped[idx].isdigit():
                idx += 1
            if idx < len(stripped) and stripped[idx] == '.' and (idx + 1 == len(stripped) or stripped[idx+1] == ' '):
                is_ol = True
                content = stripped[idx+2:] if idx+1 < len(stripped) else ""
                
        if is_ol:
            if in_paragraph: html_lines.append("            </p>"); in_paragraph = False
            if not in_ordered_list:
                html_lines.append("            <ol>")
                in_ordered_list = True
            html_lines.append(f"                <li>{parse_inline_styles(content)}</li>")
            continue
            
        # Regular Paragraph
        if not in_list and not in_ordered_list and not in_blockquote:
            if not in_paragraph:
                html_lines.append("            <p>")
                in_paragraph = True
            html_lines.append(f"                {parse_inline_styles(stripped)}")
            
    # Clean up open tags
    if in_list:
        html_lines.append("            </ul>")
    if in_ordered_list:
        html_lines.append("            </ol>")
    if in_blockquote:
        html_lines.append("            </blockquote>")
    if in_paragraph:
        html_lines.append("            </p>")
        
    return "\n".join(html_lines)

# Directories
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
CONTENT_DIR = os.path.join(BASE_DIR, "content")
POST_DIR = os.path.join(BASE_DIR, "post")
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")

def init_directories():
    """Create folders if they do not exist."""
    for folder in [CONTENT_DIR, POST_DIR, TEMPLATES_DIR]:
        if not os.path.exists(folder):
            os.makedirs(folder)
            print(f"Created folder: {os.path.basename(folder)}")

def parse_markdown_file(filepath):
    """Parse Front Matter metadata and markdown content from a file."""
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()
    
    metadata = {}
    content = text
    
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            # Parse metadata block
            meta_text = parts[1].strip()
            for line in meta_text.split("\n"):
                if ":" in line:
                    key, val = line.split(":", 1)
                    metadata[key.strip().lower()] = val.strip()
            content = parts[2].strip()
            
    return metadata, content

def protect_math(text):
    placeholders = []
    
    # 1. Protect block math: $$ ... $$
    def block_repl(match):
        idx = len(placeholders)
        placeholders.append(match.group(0))
        return f"MATHBLOCKPLACEHOLDER{idx}X"
        
    text = re.sub(r'\$\$(.*?)\$\$', block_repl, text, flags=re.DOTALL)
    
    # 2. Protect inline math: $ ... $
    def inline_repl(match):
        idx = len(placeholders)
        placeholders.append(match.group(0))
        return f"MATHINLINEPLACEHOLDER{idx}X"
        
    text = re.sub(r'\$([^\n\$]+)\$', inline_repl, text)
    
    return text, placeholders

def restore_math(html_text, placeholders):
    for idx in reversed(range(len(placeholders))):
        math_content = placeholders[idx]
        html_text = html_text.replace(f"MATHBLOCKPLACEHOLDER{idx}X", math_content)
        html_text = html_text.replace(f"MATHINLINEPLACEHOLDER{idx}X", math_content)
    return html_text


def build_site():
    init_directories()
    
    # Load templates
    post_template_path = os.path.join(TEMPLATES_DIR, "post_template.html")
    index_template_path = os.path.join(TEMPLATES_DIR, "index_template.html")
    
    if not os.path.exists(post_template_path) or not os.path.exists(index_template_path):
        print("Error: Templates are missing in templates/ folder.")
        sys.exit(1)
        
    with open(post_template_path, "r", encoding="utf-8") as f:
        post_template = f.read()
        
    with open(index_template_path, "r", encoding="utf-8") as f:
        index_template = f.read()

    # Scan content directory for markdown files
    md_files = [f for f in os.listdir(CONTENT_DIR) if f.endswith(".md")]
    if not md_files:
        print("No markdown (.md) files found in content/ directory.")
        return
        
    posts = []
    
    print(f"Found {len(md_files)} posts to process.")
    
    for md_file in md_files:
        md_path = os.path.join(CONTENT_DIR, md_file)
        metadata, content_md = parse_markdown_file(md_path)
        
        # File base name without extension
        base_name = os.path.splitext(md_file)[0]
        
        # Populate details
        title = metadata.get("title", base_name.replace("-", " ").title())
        date_str = metadata.get("date", datetime.today().strftime("%Y-%m-%d"))
        
        # Human-readable date format (e.g. May 25, 2026)
        try:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            formatted_date = dt.strftime("%B %d, %Y")
        except Exception:
            formatted_date = date_str
            
        # Estimate reading time if not provided
        if "reading_time" in metadata:
            reading_time = metadata["reading_time"]
        else:
            word_count = len(content_md.split())
            reading_time = max(1, round(word_count / 200))
            
        # Protect LaTeX math equations from markdown parsing
        protected_content_md, math_placeholders = protect_math(content_md)
        
        # Convert markdown content to HTML
        if HAS_MARKDOWN_PKG:
            content_html = markdown.markdown(
                protected_content_md, 
                extensions=['extra', 'codehilite', 'toc']
            )
            # Indent content for clean output
            content_html = "\n".join(f"            {line}" for line in content_html.split("\n"))
        else:
            content_html = parse_markdown_fallback(protected_content_md)
            
        # Restore LaTeX math equations
        content_html = restore_math(content_html, math_placeholders)
        
        # Compile post HTML
        post_html = post_template.format(
            title=title,
            formatted_date=formatted_date,
            reading_time=reading_time,
            content=content_html
        )
        
        # Save compiled HTML post
        output_path = os.path.join(POST_DIR, f"{base_name}.html")
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(post_html)
            
        print(f" Compiled: content/{md_file} -> post/{base_name}.html")
        
        # Store post details for index page rendering
        posts.append({
            "title": title,
            "date": date_str,
            "filename": f"{base_name}.html"
        })
        
    # Sort posts by date (newest first)
    posts.sort(key=lambda x: x["date"], reverse=True)
    
    # Generate thoughts lists for index.html
    posts_list_html = ""
    for post in posts:
        posts_list_html += f'                <li>\n'
        posts_list_html += f'                    <span class="meta">[{post["date"]}]</span> &ndash; \n'
        posts_list_html += f'                    <a href="post/{post["filename"]}">{post["title"]}</a>\n'
        posts_list_html += f'                </li>\n'

    # Compile index.html
    index_html = index_template.format(posts_list=posts_list_html.rstrip())
    
    # Save index.html in root
    index_path = os.path.join(BASE_DIR, "index.html")
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_html)
        
    print(" Compiled: Rebuilt main index.html successfully!")
    print("🎉 Build complete! Open index.html in a browser to preview.")

if __name__ == "__main__":
    build_site()
