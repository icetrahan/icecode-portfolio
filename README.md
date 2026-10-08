# Ice.code Portfolio

A modern, responsive portfolio website showcasing my full-stack development skills and projects. Built with Next.js, TypeScript, and Tailwind CSS, featuring an interactive 3D skin creator and comprehensive project showcase.

## 🚀 Features

- **Interactive 3D Skin Creator** - Real-time skin customization tool with Three.js integration
- **Project Portfolio** - Filterable showcase of development work across multiple technologies
- **Responsive Design** - Mobile-first approach with modern UI/UX
- **Contact Integration** - Direct contact form and social media links
- **Performance Optimized** - Fast loading with Next.js optimization features

## 🛠️ Technologies Used

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Three.js** - 3D graphics and WebGL rendering
- **React Three Fiber** - React renderer for Three.js

### Features & Tools
- **Responsive Design** - Mobile-first responsive layout
- **Image Optimization** - Next.js Image component optimization
- **SEO Friendly** - Meta tags and structured data
- **Modern UI/UX** - Clean, professional design with smooth animations

## 🎯 Key Sections

### Skin Creator (`/projects/skinCreator`)
- Interactive 3D model viewer
- Real-time color customization
- Pattern and marking options
- Export functionality
- Mobile-responsive controls

### Projects (`/projects`)
- Filterable project grid
- Technology-based filtering (Python, JavaScript, Flutter, etc.)
- GitHub integration
- Live demo links where available

### About (`/about`)
- Professional background and journey
- Technical expertise showcase
- Personal philosophy and approach

### Contact (`/contact`)
- Direct contact form
- Social media integration
- Response time expectations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/icetrahan/primal_heaven.git
cd primal_heaven
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── contact/           # Contact page
│   ├── projects/          # Projects showcase
│   │   └── skinCreator/   # 3D Skin Creator tool
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── Header.tsx         # Navigation header
│   └── Footer.tsx         # Site footer
├── styles/               # Global styles and Tailwind config
└── public/               # Static assets
    ├── projects/         # Project images
    └── icons/           # Technology icons
```

## 🎨 Design Philosophy

This portfolio demonstrates:
- **Clean, Modern Design** - Professional appearance with intuitive navigation
- **Performance First** - Optimized loading and smooth interactions
- **Mobile Responsive** - Seamless experience across all devices
- **Accessibility** - Semantic HTML and proper ARIA labels
- **Real-world Applications** - Functional tools like the skin creator showcase practical skills

## 🔧 Development Highlights

### 3D Skin Creator
- Custom Three.js integration with React
- Real-time color manipulation
- WebGL performance optimization
- Mobile touch controls

### Project Filtering System
- Dynamic filtering by technology stack
- Smart tag matching (e.g., JavaScript matches .js files)
- Smooth animations and transitions

### Performance Optimizations
- Next.js Image optimization
- Lazy loading for images
- Efficient state management
- Minimal bundle size

## 📞 Contact

- **Email**: trahantech@gmail.com
- **Discord**: Ice.code
- **GitHub**: [icetrahan](https://github.com/icetrahan)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🚀 Deployment

Live at **[icecode.dev](https://icecode.dev)**. Pushing to `main` is the deploy:
GitHub Actions builds a standalone Next.js bundle and publishes it as a release,
and the host pulls the newest release and swaps to it with no downtime. A build
that fails never reaches the site. Details, console commands and rollback:
[`deploy/README.md`](deploy/README.md).

---

Built with ❤️ by Ice - Full Stack Developer & Systems Architect
