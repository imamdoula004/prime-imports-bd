# 📦 Prime Imports BD
### Modern AI-Driven Grocery Commerce Platform (Bangladesh)

---

## 🧠 Overview

This platform is designed to dominate the imported grocery segment in Bangladesh with:

- ⚡ Instant-loading UI (mobile-first)
- 🔄 Real-time inventory synchronization
- 🤖 AI-assisted admin workflows
- 📊 Business intelligence dashboards
- 📦 Automated order lifecycle with courier integration

---

## 🏗️ Architecture

### Frontend
- **Framework:** Next.js (deployed on Vercel)
- **Design System:** Instacart-inspired UI via Stitch
- **Animations:** Spline + lightweight assets
- **UX Features:**
  - Infinite scrolling
  - Fuzzy search (handles typos)
  - Dynamic stock indicators

### Backend
- **Core:** Firebase (Firestore + Auth + Storage)
- **Structure:**
  - Strict schema for scalability
  - Real-time listeners for instant UI updates
  - Role-based admin controls

### Automation Layer
- **Engine:** n8n
- Handles:
  - Customer inquiries (AI auto-response)
  - Order tracking workflows
  - RedX courier confirmation monitoring
  - Social media & marketing integrations

---

## 🛒 Key Features

### 👤 Customer Experience
- Clean, fast, mobile-first UI
- Smart product search (tolerates misspellings)
- Real-time stock status:
  - In Stock
  - Selling Fast
  - Only a Few Left
  - Out of Stock
- Dual pricing display:
  - Market price (strikethrough)
  - Discounted price (active)

### 💳 Checkout System
- Cash on Delivery (primary)
- bKash integration
- Automated order ID generation
- Delivery charges:
  - Dhaka: 70 BDT
  - Outside Dhaka: 140 BDT

---

### 🛠️ Admin Panel

Designed for **non-technical users**.

#### Inventory Management
- Add / edit / delete products
- Quantity tracking with real-time updates
- Recycle bin system
- Category + brand filtering

#### Smart Product Handling
- AI-assisted product autofill (image detection)
- Structured product schema:
  - Title
  - Brand
  - Quantity (ml, g, kg, etc.)
  - Pricing (market vs actual)

#### Ticketing System
- Customer inquiries converted to tickets
- Full ticket lifecycle tracking
- AI-assisted responses via n8n

---

### 📊 Analytics Dashboard
- Daily / Weekly / Monthly sales insights
- Revenue tracking
- Inventory movement stats
- Ticket system analytics
- Exportable reports

---

### 👑 Golden Circle Customers
- Exclusive login portal
- Phone-number-based authentication
- Automatic 3% discount on all products

---

## 🔗 Integrations

- 🔥 Firebase (Database + Auth + Storage)
- ⚡ Vercel (Frontend deployment)
- 🔄 n8n (Automation workflows)
- 🚚 RedX API (Delivery confirmation)
- 📢 Pomeli (Advertising)
- 📈 Grotio (Marketing)
- 📱 Social APIs (Facebook, Instagram, Google)

---

## 📡 Data Pipeline

- Product data scraped from:
  - [marketdaybd.com](https://www.marketdaybd.com/)
  - [chocolateshopbd.com](https://chocolateshopbd.com/)
- Processed via Firecrawl
- Structured and injected into Firebase
- Synced in real-time with frontend

---

## ⚙️ Real-Time System Logic

- Inventory updates instantly reflect across UI
- Order placement automatically:
  - Deducts stock
  - Updates product status
- Courier confirmation triggers:
  - Order completion
  - Final database update

---

## 🎯 Design Philosophy

- **Speed first**  
- **Mobile-first dominance**  
- **Zero-lag interactions**  
- **Automation over manual operations**  
- **Admin simplicity, backend sophistication**

---

## 📁 Project Structure


```/frontend → Next.js UI
/admin → Admin dashboard
/firebase → Firestore schema + rules
/automation → n8n workflows
/scraper → Firecrawl scripts
/assets → Icons, SVG logo, media```


---

## 🧪 Current Status

- 🚧 Actively in development  
- ✅ Core frontend + admin deployed  
- 🔄 Continuous feature rollout during live testing  

---

## 🚀 Deployment

- Frontend: Vercel  
- Backend: Firebase  
- Automation: n8n (self-hosted / cloud)  

---

## 📌 Roadmap

- [ ] RedX full API automation
- [ ] Advanced product recommendation engine
- [ ] AI demand forecasting
- [ ] Supplier-side dashboard
- [ ] Mobile app version

---

## 🤝 Contribution

Currently a **closed commercial project**, but architectural suggestions and feedback are welcome.

---

## ⚠️ Disclaimer

This project is designed for real-world commercial deployment and includes integrations tailored for the Bangladeshi market.

---

## 🧠 Final Note

This isn’t just another grocery site. It’s a **foundation for a scalable commerce ecosystem** — built to expand into logistics, AI-driven retail intelligence, and beyond.



# prime-imports-bd

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
