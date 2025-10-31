# Union Parishad Digital Complaint Box

A bilingual (English/Bangla) digital complaint management system for Union Parishads in Bangladesh.

## Features

- 🔐 Secure authentication with Clerk
- 🌐 Bilingual support (English/বাংলা)
- 📱 Responsive design with Tailwind CSS
- 🔄 Real-time status updates
- 📊 Admin dashboard with analytics
- 👥 Role-based access control

## Tech Stack

### Frontend
- Next.js + React
- Tailwind CSS
- Clerk (Authentication)
- i18next (Internationalization)

### Backend
- Node.js + Express
- Prisma ORM
- MySQL Database
- Clerk JWT Verification

## Getting Started

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/union-parishad-digital-complaint-box.git
\`\`\`

2. Install dependencies:
\`\`\`bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
\`\`\`

3. Set up environment variables:
- Copy .env.example to .env
- Fill in your Clerk and Database credentials

4. Set up the database:
\`\`\`bash
cd backend
npx prisma migrate dev
\`\`\`

5. Run the development servers:
\`\`\`bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm run dev
\`\`\`

## Available Scripts

### Frontend
- \`npm run dev\`: Start development server
- \`npm run build\`: Build for production
- \`npm start\`: Start production server
- \`npm run lint\`: Run ESLint

### Backend
- \`npm run dev\`: Start development server
- \`npm start\`: Start production server
- \`npm run prisma:generate\`: Generate Prisma client
- \`npm run prisma:migrate\`: Run database migrations

## Contributing

1. Fork the repository
2. Create your feature branch: \`git checkout -b feature/my-feature\`
3. Commit your changes: \`git commit -am 'Add new feature'\`
4. Push to the branch: \`git push origin feature/my-feature\`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.