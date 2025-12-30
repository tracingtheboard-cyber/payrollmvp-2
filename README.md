# Payroll MVP - Frontend

A payroll management system built with Next.js, React, Supabase, and Tailwind CSS.

## Features

- **HR Dashboard**: Manage salary inputs, run payroll, view payslips, manage employees
- **Employee Dashboard**: View and download payslips, apply for leave
- **Leave Management**: Employee leave requests with approval workflow
- **Admin Panel**: System user management

## Tech Stack

- Next.js 16.1.1
- React 19.2.3
- Supabase (Backend & Auth)
- Tailwind CSS 4
- TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd payroll-ui
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create a `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Deployment

See [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) for detailed deployment instructions.

### Quick Deploy to Vercel

1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel Dashboard
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

## Database Setup

See SQL files in project root:
- `create_leave_requests_table.sql` - Leave requests table
- `add_evidence_url_to_leaves.sql` - Add evidence URL column
- `add_remark_to_leaves.sql` - Add remark column
- `setup_leaves_rls_simple.sql` - RLS policies for leaves table
- `setup_storage_rls.sql` - Storage bucket policies

## Project Structure

```
app/
  admin/          # Admin dashboard
  employee/       # Employee pages
  hr/            # HR pages
  login/         # Login page
  salary/        # Salary input
  payslips/      # Payslip management
components/      # Reusable components
lib/             # Utilities and hooks
```

## License

Private project
