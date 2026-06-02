---
title: On Policy Gradient Methods
date: 2026-05-24
reading_time: 6
---

In reinforcement learning, we seek to find a policy that maximizes the expected cumulative reward. While value-based methods like Q-learning indirectly discover a policy by estimating optimal state-action values, **policy gradient methods** parameterize the policy directly and optimize it using gradient ascent. 

In this post, we derive the fundamental theorem underlying these methods, discuss the classic REINFORCE algorithm, and explore how baselines help manage the notorious variance of policy gradient estimators.

---

### 1. The Objective Function

Let $\pi_\theta(a \mid s)$ be a stochastic policy parameterized by $\theta \in \mathbb{R}^d$. The policy defines a probability distribution over actions $a \in \mathcal{A}$ given a state $s \in \mathcal{S}$. 

A trajectory $\tau = (s_0, a_0, s_1, a_1, \dots, s_T)$ represents a sequence of states and actions in the environment. The probability of a trajectory under the policy $\pi_\theta$ and transition dynamics $P(s_{t+1} \mid s_t, a_t)$ is given by:

$$P(\tau; \theta) = \rho_0(s_0) \prod_{t=0}^{T-1} P(s_{t+1} \mid s_t, a_t) \pi_\theta(a_t \mid s_t)$$

where $\rho_0$ is the initial state distribution.

Let $R(\tau) = \sum_{t=0}^{T} \gamma^t r_t$ be the cumulative discounted return of a trajectory. Our goal is to maximize the expected return:

$$J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} [R(\tau)] = \int P(\tau; \theta) R(\tau) d\tau$$

---

### 2. The Policy Gradient Theorem

To optimize $J(\theta)$ using gradient ascent, we need to calculate the gradient $\nabla_\theta J(\theta)$. Because the expectation depends on $\theta$ through the probability distribution $P(\tau; \theta)$, we cannot simply push the gradient inside the expectation. 

Instead, we use the **log-derivative trick** (also known as the likelihood ratio trick or REINFORCE trick):

$$\nabla_\theta \log P(\tau; \theta) = \frac{\nabla_\theta P(\tau; \theta)}{P(\tau; \theta)} \implies \nabla_\theta P(\tau; \theta) = P(\tau; \theta) \nabla_\theta \log P(\tau; \theta)$$

Now, we expand the gradient of the objective:

$$\begin{aligned}
\nabla_\theta J(\theta) &= \nabla_\theta \int P(\tau; \theta) R(\tau) d\tau \\
&= \int \nabla_\theta P(\tau; \theta) R(\tau) d\tau \\
&= \int P(\tau; \theta) \nabla_\theta \log P(\tau; \theta) R(\tau) d\tau \\
&= \mathbb{E}_{\tau \sim \pi_\theta} \left[ \nabla_\theta \log P(\tau; \theta) R(\tau) \right]
\end{aligned}$$

Next, let's take the logarithm of the trajectory probability $P(\tau; \theta)$:

$$\log P(\tau; \theta) = \log \rho_0(s_0) + \sum_{t=0}^{T-1} \log P(s_{t+1} \mid s_t, a_t) + \sum_{t=0}^{T-1} \log \pi_\theta(a_t \mid s_t)$$

When we take the gradient with respect to $\theta$, the terms representing the initial state distribution and environment transitions disappear because they do not depend on $\theta$:

$$\nabla_\theta \log P(\tau; \theta) = \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t)$$

Substituting this back into our gradient expression yields the **Policy Gradient Theorem**:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t) R(\tau) \right]$$

> **The Magic of Policy Gradients:** Notice that the environment transition dynamics $P(s_{t+1} \mid s_t, a_t)$ have completely vanished from the gradient! This means we can compute the exact gradient of our objective without knowing how the world works—we only need to sample trajectories from our current policy.

---

### 3. The REINFORCE Algorithm

The simplest practical implementation of this theorem is the **REINFORCE** algorithm (Williams, 1992), a Monte Carlo policy gradient method. 

In practice, using the full trajectory return $R(\tau)$ to update every action is highly inefficient and ignores causality. An action $a_t$ taken at time $t$ cannot affect rewards received *before* time $t$. Therefore, we can replace the total return $R(\tau)$ with the **reward-to-go** $G_t$:

$$G_t = \sum_{t'=t}^{T} \gamma^{t'-t} r_{t'}$$

This yields the causality-adjusted policy gradient:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t) G_t \right]$$

Using a batch of $N$ sampled trajectories, we estimate the policy gradient as:

$$\nabla_\theta J(\theta) \approx \frac{1}{N} \sum_{i=1}^N \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t^{(i)} \mid s_t^{(i)}) G_t^{(i)}$$

We then update our policy parameters using gradient ascent:

$$\theta \leftarrow \theta + \alpha \nabla_\theta J(\theta)$$

where $\alpha$ is the learning rate.

---

### 4. Reducing Variance with a Baseline

Because REINFORCE relies on Monte Carlo rollouts to estimate $G_t$, the empirical returns can vary wildly from sample to sample. This high variance leads to slow convergence and unstable training.

To mitigate this, we subtract a state-dependent **baseline** $b(s_t)$ from the return. The policy gradient becomes:

$$\nabla_\theta J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_{t=0}^{T-1} \nabla_\theta \log \pi_\theta(a_t \mid s_t) (G_t - b(s_t)) \right]$$

Subtracting a baseline does not introduce any bias. To see why, consider the expectation of the subtracted term for a single time step:

$$\mathbb{E}_{a_t \sim \pi_\theta} \left[ \nabla_\theta \log \pi_\theta(a_t \mid s_t) b(s_t) \right] = \sum_{a_t} \pi_\theta(a_t \mid s_t) \frac{\nabla_\theta \pi_\theta(a_t \mid s_t)}{\pi_\theta(a_t \mid s_t)} b(s_t) = b(s_t) \nabla_\theta \sum_{a_t} \pi_\theta(a_t \mid s_t)$$

Since probabilities must sum to $1$ ($\sum_{a_t} \pi_\theta(a_t \mid s_t) = 1$), its gradient with respect to $\theta$ is zero:

$$b(s_t) \nabla_\theta (1) = 0$$

Thus, any baseline function that depends only on state $s$ (and not action $a$) keeps the expected gradient completely unbiased while dramatically reducing variance. 

A common choice for $b(s_t)$ is a learned state-value function $V^\phi(s_t)$, which leads directly to **Actor-Critic methods**, where the actor updates the policy $\pi_\theta$ and the critic updates the value baseline $V^\phi$.
