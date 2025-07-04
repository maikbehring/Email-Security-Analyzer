# Email Security Analyzer

A cybersecurity email analysis platform that uses AI to assess phishing risks and validate email authentication.

## Features

- **AI-Powered Analysis**: Uses OpenAI GPT-4o to detect phishing indicators and assess threat levels
- **Email Authentication**: Validates SPF, DKIM, and DMARC records 
- **File Support**: Accepts .eml, .msg, and .txt email files
- **Risk Assessment**: Categorizes emails as LOW, MEDIUM, or HIGH risk with confidence scores
- **Link Analysis**: Extracts and analyzes suspicious URLs
- **Attachment Processing**: Identifies and analyzes email attachments
- **Export Functionality**: Export analysis results as JSON reports
- **Dashboard**: Real-time statistics and analysis history
- **Database Persistence**: PostgreSQL storage for all analyses

## Tech Stack

- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4o
- **File Upload**: Multer middleware

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `DATABASE_URL`: PostgreSQL connection string
4. Push database schema: `npm run db:push`
5. Start development server: `npm run dev`

## Usage

1. Upload an email file (.eml, .msg, or .txt)
2. Review the AI-powered risk assessment
3. Check authentication validation results
4. Analyze extracted links and attachments
5. Export results for security teams

## Security Features

- Domain spoofing detection
- Suspicious URL identification
- Urgent language pattern recognition
- Email authentication validation
- Attachment security analysis
- Comprehensive threat reporting

## License

MIT License