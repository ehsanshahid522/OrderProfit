# OrderProfit

An e-commerce operations dashboard for tracking orders, costs and net profit. Built with a React frontend and an Express / MongoDB backend.

[Project demo](https://order-profit.vercel.app/) · [Developer portfolio](https://ehsanshahid.online/)

## Purpose

Revenue alone does not show what an order earns. OrderProfit brings order information and associated expenses together so sellers can review profit alongside their operating costs.

## Application areas

- Account registration and authentication.
- Product sheets and order management.
- Cost tracking for order-related expenses.
- Dashboard summaries and profit calculations.
- Company settings and an insights API.

**Calculation:** Net profit = revenue − recorded costs. Results depend on the costs entered by the user.

## Technology

| Layer | Current implementation |
| --- | --- |
| Frontend | React 18, JavaScript, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Authentication | JWT and bcrypt |
| Supporting tools | jsPDF, Lucide React |
| Deployment | Vercel configuration and an API entry point are included |

## Run locally

### 1. Install dependencies

~~~bash
git clone https://github.com/ehsanshahid522/OrderProfit.git
cd OrderProfit
npm install
npm install --prefix server
~~~

Use a Node.js version compatible with the dependencies and have MongoDB available locally or through a hosted connection.

### 2. Configure the backend

Copy `server/.env.example` to `server/.env` and provide your own values.

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; the server defaults to 5000 |
| `MONGODB_URI` | Database connection string |
| `JWT_SECRET` | Authentication signing secret |
| `NODE_ENV` | Use a development environment for the local server |

Do not commit real credentials. The local server opens its port after the MongoDB connection succeeds.

### 3. Start the API

From the repository root:

~~~bash
npm run server
~~~

This script changes into `server/` and starts the backend with nodemon, so the `server/.env` file is loaded from that directory.

### 4. Start the frontend

In a second terminal, from the repository root:

~~~bash
npm run dev
~~~

Open the local URL printed by Vite. Ensure the frontend's API configuration points to your running backend.

### Other scripts

| Command | Purpose |
| --- | --- |
| `npm run build` | Create the frontend production build |
| `npm run preview` | Preview the frontend build locally |
| `npm run lint` | Run the configured ESLint checks |

## Repository guide

| Location | Contents |
| --- | --- |
| `src/` | React application |
| `public/` | Public frontend assets |
| `server/routes/` | Authentication, orders, costs, dashboard, insights, company and product-sheet routes |
| `server/controllers/` | Request handling |
| `server/models/` | MongoDB models |
| `server/services/` | Supporting backend services |
| `server/server.js` | Express setup and MongoDB connection |
| `api/` and `vercel.json` | Deployment entry point and configuration |

## Contact

[Ehsan Shahid](https://ehsanshahid.online/) · [LinkedIn](https://www.linkedin.com/in/chehsanshahid/) · [Email](mailto:ehsanshahid522@gmail.com)
