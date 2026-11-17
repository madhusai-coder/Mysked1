# MySked — Smart Student Productivity & Study Planner

**Tagline:** Plan Smarter. Study Better. Achieve More.

## Architecture Overview

This repository includes:
1. **3D-Interactive Frontend + Live Preview Runtime (`/src`, `/server.ts`)**:
   - **Three.js 3D Experience**: Full-screen procedural 3D hero scene (`HeroAcademicScene.tsx`) with 6 composite multi-part academic models (hardcover books, laptop, analog study clock, desk calendar, checklist board, graduation cap), particle field, mouse parallax, scroll-driven camera transitions, 3D tilt holographic glass cards, 3D flip product carousel, and 3D rotating tech-stack cubes (`Java 17`, `Spring Boot`, `MySQL 8`, `Three.js`).
   - **Performance & Accessibility**: Software WebGL detection (`isSoftwareGl`), `IntersectionObserver` pausing when off-screen, `prefers-reduced-motion` compliance, and clean SVG/CSS fallbacks when WebGL is unavailable.
   - **Chart.js Analytics & GSAP ScrollTrigger**: Daily/weekly/monthly bar, line, and doughnut charts plus scroll-triggered reveals.
   - **12 Working App Pages**: Dashboard, My Study Planner, My Tasks, My Subjects, Exam Preparation, Focus Mode, Notes & Resources, Goals & Habits, Analytics, Academic Performance, Notifications, and Settings.
   - **Runtime API Mirror (`server.ts`)**: Because the AI Studio preview sandbox runs Node.js 22 without a JVM/MySQL daemon, `server.ts` serves a faithful persistent mirror of the REST endpoints so every form, drag-and-drop planner, Pomodoro timer, voice task parser, PDF attachment, and rule-based advisor works immediately in the live preview.

2. **Java Spring Boot + Maven + MySQL Backend (`/backend-spring-boot`)**:
   - **Stack**: Java 17, Spring Boot 3.3.4, Spring MVC, Spring Data JPA, Spring Security (Stateless JWT + BCrypt), Bean Validation, Maven, MySQL 8.
   - **Normalized MySQL Schema (`/backend-spring-boot/database/schema.sql`)**: 12 normalized tables (`students`, `subjects`, `tasks`, `study_sessions`, `exams`, `syllabus`, `goals`, `habits`, `notes`, `marks`, `reminders`, `notifications`) with primary keys, foreign keys, composite indexes, timestamps, and per-student ownership.
   - **Deterministic Business Logic Services**:
     - `RecommendationEngineService.java`: Rule-based study advisor explaining the exact triggered rule (`RULE_OVERDUE_DEADLINE`, `RULE_EXAM_SYLLABUS_GAP`, `RULE_WEEKLY_TARGET_DEFICIT`).
     - `TimetableGeneratorService.java`: Conflict-free weekly timetable generator prioritized by subject hour deficits.
     - `VoiceTaskParserService.java`: Parses natural speech transcripts into structured tasks.

---

## Demo Account

- **Email:** `demo@mysked.app`
- **Password:** `Demo@1234`
- Clearly labeled inside the Login modal and App header banner. Newly registered accounts start completely empty with zero fabricated statistics.

---

## Running the Live Preview (Node/Vite)

```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

---

## Running the Java Spring Boot + MySQL Backend

### 1. Initialize MySQL 8
```bash
mysql -u root -p < backend-spring-boot/database/schema.sql
mysql -u root -p < backend-spring-boot/database/seed_demo.sql
```

### 2. Configure Environment Variables
```bash
export MYSQL_URL="jdbc:mysql://localhost:3306/mysked_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
export MYSQL_USER="root"
export MYSQL_PASSWORD="your_mysql_password"
export JWT_SECRET="replace-with-at-least-32-character-random-secret"
```

### 3. Build & Run with Maven
```bash
cd backend-spring-boot
mvn clean package
mvn spring-boot:run
```
The Spring Boot API listens on `http://localhost:8080`.

---

## Testing Instructions

1. **Authentication & Isolation**:
   - Click **Explore Demo Workspace** to sign into `demo@mysked.app`.
   - Log out and **Register** a brand-new student account; verify that Dashboard KPIs start at `0` (no fake stats) and every created record is isolated to that account.
2. **3D & Reduced Motion**:
   - Scroll the landing page to observe scroll-driven camera motion, hover feature cards for 3D tilt, click the product tour card to flip it 180°, and hover the tech-stack cards to accelerate the 3D WebGL cubes.
   - Toggle **Light Mode / Dark Mode** from the hero, footer, or app header.
3. **Planner, Tasks & Voice Entry**:
   - Drag and drop a session card across days in **My Study Planner** and test **Auto-Generate Timetable**.
   - In **My Tasks**, test **Speak Task** (or type `"Submit OS lab urgent due tomorrow 90 minutes"` into the fallback box) and click **Parse & Save Task**.
4. **Exams, Focus Mode, Notes & Exports**:
   - Check off syllabus units in **Exam Preparation** and click **Plan Revision**.
   - Start and finish/log a sprint in **Focus Mode** and verify the minutes appear in Focus History and Subject hours.
   - Upload a PDF in **Notes & Resources**, record a score in **Academic Performance**, and export CSV/JSON in **Analytics** or **Settings**.
