# nami.

<div align="center">
  <img src="./frontend/public/logo.png" alt="Nami Logo" width="120" />
  <br />
  <h1>Your Personal Travel Archive</h1>
  <p>
    <strong>Archive, map, and reflect on your journeys — all from a calm retro interface.</strong>
  </p>
  <p>
    <a href="https://nextjs.org/">
      <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js" />
    </a>
    <a href="https://fastapi.tiangolo.com/">
      <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
    </a>
    <a href="https://tailwindcss.com/">
      <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    </a>
    <a href="https://supabase.com/">
      <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
    </a>
  </p>
</div>

---

## 📖 Overview

**nami.** (Trails & Tales) is a personal travel journal and memory archive designed to help you preserve, visualize, and reflect on your travel experiences. By letting you upload photos and combining them with location-aware data, Nami automatically extracts coordinates via EXIF metadata to map your trails on an interactive dashboard. Built with a beautiful, minimal retro aesthetic, Nami turns scattered travel moments into a structured digital atlas.

## ✨ Features

- **🏠 Smart Dashboard**: A personalized command center displaying time-appropriate greeting quotes and an easy gateway to log new memories.
- **📚 Retro Journal**: A timeline-styled diary containing your dates, locations, categories, ratings, and detailed notes.
- **🗺️ Journey Map**: An interactive geographic map highlighting the exact trails and locations you've pinned.
- **📊 Travel Analytics**: Detailed breakdowns of your memories by category, ratings, and locations to reflect on your travels.
- **📸 Intelligent Photo Upload**: Automatic EXIF metadata extraction to pull latitude/longitude directly from your uploaded images, paired with reverse geocoding to determine location names.
- **🔐 Secure Authentication**: Robust login and profile persistence powered by Supabase Auth.
- **🎨 Minimal Retro UI/UX**: A thoughtfully crafted, custom interface featuring soft sage palettes, structured retro edges, and smooth animations.

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tabler.io/icons)
- **Interactive Map**: [React Leaflet](https://react-leaflet.js.org/) & [Leaflet](https://leafletjs.com/)
- **Charts/Data Vis**: [Recharts](https://recharts.org/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Metadata Extraction**: [piexif](https://pypi.org/project/piexif/) & [Pillow (PIL)](https://pillow.readthedocs.io/)
- **Geocoding**: OpenStreetMap Nominatim API (Reverse Geocoding)
- **Web Server**: [Uvicorn](https://www.uvicorn.org/)

### Database & BaaS
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Storage**: Supabase Storage Buckets (for memory images)

## 🚀 Getting Started

Follow these steps to set up both the backend and frontend locally.

### Prerequisites
- Node.js (v18 or higher)
- Python (v3.9 or higher)
- Supabase account and project setup

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/vanshikapringle/NAMI.git
    cd NAMI
    ```

2.  **Backend Setup**
    Navigate to the backend directory, create a virtual environment, and install dependencies:
    ```bash
    cd backend
    python -m venv venv
    # On Windows:
    .\venv\Scripts\activate
    # On macOS/Linux:
    source venv/bin/activate

    pip install fastapi uvicorn pydantic piexif Pillow python-dotenv
    ```
    Create a `.env` file in the `backend` directory:
    ```env
    # Add any backend configuration if required
    ```
    Run the FastAPI server:
    ```bash
    python main.py
    ```
    The API will be running on `http://localhost:8000`.

3.  **Frontend Setup**
    Navigate to the frontend directory and install dependencies:
    ```bash
    cd ../frontend
    npm install
    ```
    Create a `.env.local` file in the `frontend` directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```
    Run the Next.js development server:
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` to view the application in your browser.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
  <sub>Built with ❤️ by Vanshika Pringle</sub>
</div>
