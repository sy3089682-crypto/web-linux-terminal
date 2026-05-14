# Contributing to V-PLATFORM

Thank you for your interest in contributing to V-PLATFORM! We welcome contributions from everyone. This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

Please be respectful and constructive. We're committed to providing a welcoming and inclusive environment for all contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git
- Familiarity with React, Node.js, and TypeScript

### Setup Development Environment

```bash
# Clone the repository
git clone https://github.com/sy3089682-crypto/web-linux-terminal.git
cd web-linux-terminal

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# Create .env files (see README for details)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development
docker-compose up --build
```

## 📋 How to Contribute

### 1. Fork & Branch
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR-USERNAME/web-linux-terminal.git
cd web-linux-terminal

# Create a feature branch
git checkout -b feature/your-feature-name
# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

**Follow these guidelines:**
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Add tests for new features
- Update documentation
- Follow the existing code style

**Code Style:**
- Use TypeScript for type safety
- Follow [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- Format with Prettier: `prettier --write .`
- Lint with ESLint: `npm run lint`

### 3. Testing

```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Build check
npm run build
```

### 4. Commit

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"
# or
git commit -m "fix: resolve issue with X"
```

**Commit Message Format:**
- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Build process, dependencies, etc.

### 5. Push & Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create a Pull Request on GitHub
# - Provide a clear title
# - Reference related issues (#123)
# - Describe what you changed and why
```

## 📝 Pull Request Guidelines

- **Title:** Clear and descriptive (e.g., "Add real-time code sync feature")
- **Description:** Include:
  - What problem does this solve?
  - How does it work?
  - Any breaking changes?
  - Screenshots/demos (if applicable)
- **Linked Issues:** Reference related issues
- **Tests:** Include tests for new functionality
- **Documentation:** Update docs if behavior changed

### PR Template

```markdown
## Description
Brief description of changes

## Related Issues
Closes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Change 1
- Change 2

## Testing
How to test these changes:
1. Step 1
2. Step 2

## Screenshots (if applicable)
![screenshot](url)

## Checklist
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No new warnings generated
```

## 🧪 Testing Checklist

Before submitting:
- [ ] Frontend builds without errors
- [ ] Backend starts without errors
- [ ] No console errors/warnings
- [ ] Feature works as described
- [ ] Tests pass locally
- [ ] No security issues (run `npm audit`)

## 📚 Documentation

If your contribution changes:
- **Behavior:** Update README or relevant docs
- **API:** Update API documentation
- **Features:** Add examples
- **Config:** Update .env.example files

## 🐛 Reporting Bugs

Found a bug? Please create an issue with:
- **Title:** Clear bug description
- **Reproduction:** Steps to reproduce
- **Expected:** What should happen
- **Actual:** What actually happens
- **Environment:** OS, Node version, browser, etc.
- **Screenshots:** If applicable

### Bug Report Template

```markdown
## Description
Brief bug description

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: (e.g., macOS 12.0)
- Node: (e.g., v18.0.0)
- Browser: (if applicable)

## Screenshots/Logs
(if applicable)
```

## ✨ Feature Requests

Want to suggest an enhancement?
- **Description:** Clear description of feature
- **Motivation:** Why is this useful?
- **Examples:** How would users use it?
- **Alternatives:** Have you considered other approaches?

## 📞 Need Help?

- **Questions:** Use GitHub Discussions
- **Issues:** Check existing issues first
- **Documentation:** See README and docs/
- **Email:** sy3089682-crypto@github.com

## 🎉 Review Process

1. Maintainers review PR
2. Feedback & requested changes (if any)
3. Approval from maintainer
4. Merge to main branch
5. Your contribution is live!

## 📦 Release Process

We follow semantic versioning:
- **Major:** Breaking changes
- **Minor:** New features (backward compatible)
- **Patch:** Bug fixes

## 🙏 Thank You!

Your contributions make V-PLATFORM better. We appreciate:
- Code contributions
- Bug reports
- Documentation improvements
- Feature suggestions
- Community engagement

---

**Happy coding! 💻✨**
