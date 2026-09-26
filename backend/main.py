from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from routers import auth, clients, projects, tasks, comments, time_entries, attachments, invitations, dashboard
import os

app = FastAPI(title="AgencyDesk API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(clients.router, prefix="/clients", tags=["clients"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
app.include_router(comments.router, prefix="/comments", tags=["comments"])
app.include_router(time_entries.router, prefix="/time_entries", tags=["time_entries"])
app.include_router(attachments.router, prefix="/attachments", tags=["attachments"])
app.include_router(invitations.router, prefix="/invitations", tags=["invitations"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])

@app.get("/health")
def health(): return {"status": "ok"}
