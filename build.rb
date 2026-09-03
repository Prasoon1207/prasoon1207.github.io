#!/usr/bin/env ruby
# frozen_string_literal: true

require 'fileutils'
require 'date'

BASE_DIR = File.expand_path(__dir__)
CONTENT_DIR = File.join(BASE_DIR, 'content')
POST_DIR = File.join(BASE_DIR, 'post')
TEMPLATES_DIR = File.join(BASE_DIR, 'templates')

def init_directories
  [CONTENT_DIR, POST_DIR, TEMPLATES_DIR].each do |folder|
    unless Dir.exist?(folder)
      FileUtils.mkdir_p(folder)
      puts "Created folder: #{File.basename(folder)}"
    end
  end
end

def parse_markdown_file(filepath)
  text = File.read(filepath, encoding: 'UTF-8')
  metadata = {}
  content = text

  if text.start_with?('---')
    parts = text.split('---', 3)
    if parts.length >= 3
      meta_text = parts[1].strip
      meta_text.each_line do |line|
        if line.include?(':')
          key, val = line.split(':', 2)
          metadata[key.strip.downcase] = val.strip
        end
      end
      content = parts[2].strip
    end
  end

  [metadata, content]
end

def protect_math(text)
  placeholders = []

  # 1. Protect block math: $$ ... $$
  text = text.gsub(/\$\$(.*?)\$\$/m) do
    idx = placeholders.length
    placeholders << Regexp.last_match(0)
    "MATHBLOCKPLACEHOLDER#{idx}X"
  end

  # 2. Protect inline math: $ ... $
  text = text.gsub(/\$([^\n\$]+)\$/) do
    idx = placeholders.length
    placeholders << Regexp.last_match(0)
    "MATHINLINEPLACEHOLDER#{idx}X"
  end

  [text, placeholders]
end

def restore_math(html_text, placeholders)
  placeholders.each_with_index.reverse_each do |math_content, idx|
    html_text = html_text.gsub("MATHBLOCKPLACEHOLDER#{idx}X", math_content)
    html_text = html_text.gsub("MATHINLINEPLACEHOLDER#{idx}X", math_content)
  end
  html_text
end

def parse_inline_styles(text)
  # Bold: **text** -> <b>text</b>
  text = text.gsub(/\*\*(.*?)\*\*/, '<b>\1</b>')
  # Italics: *text* -> <i>text</i>
  text = text.gsub(/\*(.*?)\*/, '<i>\1</i>')
  # Italics: _text_ -> <i>text</i>
  text = text.gsub(/_(.*?)_/, '<i>\1</i>')
  # Code: `code` -> <code>code</code>
  text = text.gsub(/`(.*?)`/, '<code>\1</code>')
  # Links: [text](url) -> <a href="url">text</a>
  text = text.gsub(/\[(.*?)\]\((.*?)\)/, '<a href="\2">\1</a>')
  text
end

def parse_markdown_fallback(text)
  lines = text.split("\n")
  html_lines = []
  in_list = false
  in_ordered_list = false
  in_blockquote = false
  in_paragraph = false

  lines.each do |line|
    line_raw = line.sub(/[\r\n]+\z/, '')
    stripped = line_raw.strip

    if stripped.empty?
      if in_list
        html_lines << '            </ul>'
        in_list = false
      end
      if in_ordered_list
        html_lines << '            </ol>'
        in_ordered_list = false
      end
      if in_blockquote
        html_lines << '            </blockquote>'
        in_blockquote = false
      end
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      next
    end

    # Headers
    if stripped.start_with?('### ')
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      html_lines << "            <h3>#{parse_inline_styles(stripped[4..-1])}</h3>"
      next
    elsif stripped.start_with?('## ')
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      html_lines << "            <h2>#{parse_inline_styles(stripped[3..-1])}</h2>"
      next
    elsif stripped.start_with?('# ')
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      html_lines << "            <h1>#{parse_inline_styles(stripped[2..-1])}</h1>"
      next
    end

    # Blockquotes
    if stripped.start_with?('> ')
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      unless in_blockquote
        html_lines << '            <blockquote>'
        in_blockquote = true
      end
      content = stripped[2..-1]
      html_lines << "                <p>#{parse_inline_styles(content)}</p>"
      next
    end

    # Bullet lists
    if stripped.start_with?('* ') || stripped.start_with?('- ')
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      unless in_list
        html_lines << '            <ul>'
        in_list = true
      end
      content = stripped[2..-1]
      html_lines << "                <li>#{parse_inline_styles(content)}</li>"
      next
    end

    # Ordered lists
    is_ol = false
    ol_content = ''
    if stripped =~ /^(\d+)\.\s*(.*)$/
      is_ol = true
      ol_content = Regexp.last_match(2)
    end

    if is_ol
      if in_paragraph
        html_lines << '            </p>'
        in_paragraph = false
      end
      unless in_ordered_list
        html_lines << '            <ol>'
        in_ordered_list = true
      end
      html_lines << "                <li>#{parse_inline_styles(ol_content)}</li>"
      next
    end

    # Regular paragraph
    if !in_list && !in_ordered_list && !in_blockquote
      unless in_paragraph
        html_lines << '            <p>'
        in_paragraph = true
      end
      html_lines << "                #{parse_inline_styles(stripped)}"
    end
  end

  html_lines << '            </ul>' if in_list
  html_lines << '            </ol>' if in_ordered_list
  html_lines << '            </blockquote>' if in_blockquote
  html_lines << '            </p>' if in_paragraph

  html_lines.join("\n")
end

def build_site
  init_directories

  post_template_path = File.join(TEMPLATES_DIR, 'post_template.html')
  index_template_path = File.join(TEMPLATES_DIR, 'index_template.html')

  unless File.exist?(post_template_path) && File.exist?(index_template_path)
    warn 'Error: Templates are missing in templates/ folder.'
    exit 1
  end

  post_template = File.read(post_template_path, encoding: 'UTF-8')
  index_template = File.read(index_template_path, encoding: 'UTF-8')

  md_files = Dir.exist?(CONTENT_DIR) ? Dir.children(CONTENT_DIR).select { |f| f.end_with?('.md') } : []
  if md_files.empty?
    puts "No markdown (.md) files found in content/ directory. Index will show a 'coming soon' placeholder."
  end

  posts = []
  puts "Found #{md_files.length} posts to process."

  md_files.each do |md_file|
    md_path = File.join(CONTENT_DIR, md_file)
    metadata, content_md = parse_markdown_file(md_path)

    base_name = File.basename(md_file, '.md')

    title = metadata['title'] || base_name.tr('-', ' ').split.map(&:capitalize).join(' ')
    date_str = metadata['date'] || Date.today.strftime('%Y-%m-%d')

    begin
      dt = Date.parse(date_str)
      formatted_date = dt.strftime('%B %d, %Y')
    rescue StandardError
      formatted_date = date_str
    end

    reading_time = if metadata['reading_time']
                     metadata['reading_time']
                   else
                     word_count = content_md.split.length
                     [1, (word_count / 200.0).round].max
                   end

    protected_content_md, math_placeholders = protect_math(content_md)
    content_html = parse_markdown_fallback(protected_content_md)
    content_html = restore_math(content_html, math_placeholders)

    # Post template has {{ and }} for MathJax which in Python was escaped, and {var} for replacement
    post_html = post_template.gsub('{{', '{').gsub('}}', '}')
    post_html = post_html.gsub('{title}', title)
    post_html = post_html.gsub('{formatted_date}', formatted_date)
    post_html = post_html.gsub('{reading_time}', reading_time.to_s)
    post_html = post_html.gsub('{content}', content_html)

    output_path = File.join(POST_DIR, "#{base_name}.html")
    File.write(output_path, post_html, encoding: 'UTF-8')
    puts " Compiled: content/#{md_file} -> post/#{base_name}.html"

    posts << {
      'title' => title,
      'date' => date_str,
      'filename' => "#{base_name}.html"
    }
  end

  # Sort posts by date (newest first)
  posts.sort_by! { |p| p['date'] }.reverse!

  posts_list_html = String.new
  posts.each do |post|
    posts_list_html << "                <li>\n"
    posts_list_html << "                    <span class=\"meta\">[#{post['date']}]</span> &ndash; \n"
    posts_list_html << "                    <a href=\"post/#{post['filename']}\">#{post['title']}</a>\n"
    posts_list_html << "                </li>\n"
  end

  if posts.empty?
    posts_list_html = "                <li class=\"meta\">The first one is coming soon.</li>\n"
  end

  index_html = index_template.sub('{posts_list}', posts_list_html.rstrip)
  index_path = File.join(BASE_DIR, 'index.html')
  File.write(index_path, index_html, encoding: 'UTF-8')

  puts ' Compiled: Rebuilt main index.html successfully!'
  puts '🎉 Build complete! Open index.html in a browser or run ./preview.sh to preview.'
end

build_site if __FILE__ == $PROGRAM_NAME
