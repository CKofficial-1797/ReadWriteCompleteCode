### 📚 ReadWrite Paradise

**ReadWrite Paradise** is a full-stack, microservices-based blogging platform built to showcase production-grade backend architecture, scalable system design, DevOps pipelines, and modern full-stack practices.

---

### 🚀 Tech Stack

- **Backend**: Node.js, Express.js  
- **Frontend**: Next.js (React-based)  
- **Database**: MongoDB (for blogs), PostgreSQL (for users)  
- **Caching**: Redis  
- **Messaging Queue**: RabbitMQ  
- **Authentication**: Google OAuth 2.0, JWT  
- **Deployment**: Docker, Docker Compose  

---

### 🏗️ Microservices Architecture

Each microservice is isolated, independently deployable, and communicates via REST and RabbitMQ.

1. **User Service**  
   - Handles registration, login, Google OAuth  
   - Manages JWT tokens and role-based access control

2. **Author Service**  
   - Manages author profiles, reputation system, and verification

3. **Blog Service**  
   - CRUD for blog posts  
   - Supports feed generation and tagging

4. **Notification/Event Service**  
   - Uses RabbitMQ to send async notifications on new blog posts

5. **Redis Cache Layer**  
   - Stores frequently accessed data like blog feeds and popular posts

---

### 📁 Repository Structure

```
ReadWriteCompleteCode/
├── user-service/
├── author-service/
├── blog-service/
├── notification-service/
├── gateway/                # Optional API Gateway (if present)
├── shared/                 # Common config/utilities
└── docker-compose.yml
```

---

### ✅ Key Features

- Modular microservices architecture
- Google OAuth 2.0 + JWT authentication
- Role-based access control (user vs. author)
- Caching with Redis for performance optimization
- Asynchronous communication with RabbitMQ
- Hybrid data model using SQL (PostgreSQL) and NoSQL (MongoDB)
- Fully containerized with Docker & Docker Compose

---

### 🔧 Getting Started

#### 1. Clone the Repository

```bash
git clone https://github.com/CKofficial-1797/ReadWriteCompleteCode.git
cd ReadWriteCompleteCode
```

#### 2. Setup Environment Files

Create `.env` files for each microservice. Include the following variables:

- `PORT=...`
- `DB_URL=...` (MongoDB or PostgreSQL)
- `JWT_SECRET=...`
- `REDIS_URL=...`
- `RABBITMQ_URL=...`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`

#### 3. Run with Docker Compose

```bash
docker-compose up --build
```

---

### 📬 API Overview

Here are some sample endpoints (paths may vary based on service configs):

- `POST /api/users/signup`  
- `POST /api/users/login`  
- `GET /api/blogs/feed`  
- `POST /api/blogs/create`  
- `GET /api/authors/profile`

---

### 🧠 System Flow

1. User signs up or logs in (OAuth or credentials).
2. JWT token issued & used for accessing protected routes.
3. Authors post blogs, which get cached in Redis.
4. Blog creation triggers an event in RabbitMQ.
5. Notification service handles delivery (log/email/future integrations).

---

### 🧪 Development Tips

- Each service is independently runnable — helpful for debugging
- Use `docker-compose down -v` to reset containers and volumes
- Logs are streamed per container; monitor them using `docker-compose logs -f <service_name>`

---

### 🤝 Contributing

Pull requests are welcome! Feel free to suggest:

- New services (comments, analytics, recommendations)
- Improvements in performance, security, or structure
- CI/CD and testing enhancements

---

### 📄 License

This project is licensed under the MIT License.  
Feel free to fork and build upon it!

---

### 🙌 Acknowledgments

Built to demonstrate full-stack engineering and DevOps skills using modern best practices.

---

**Happy Coding 🚀**
