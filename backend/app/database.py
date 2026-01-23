from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite specific
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_migrations():
    """Run database migrations for new columns."""
    inspector = inspect(engine)

    # Check if buttons table exists
    if 'buttons' in inspector.get_table_names():
        columns = [col['name'] for col in inspector.get_columns('buttons')]

        # Add animation columns if they don't exist
        with engine.connect() as conn:
            if 'animation' not in columns:
                conn.execute(text('ALTER TABLE buttons ADD COLUMN animation VARCHAR'))
            if 'animation_speed' not in columns:
                conn.execute(text("ALTER TABLE buttons ADD COLUMN animation_speed VARCHAR DEFAULT 'normal'"))
            if 'animation_trigger' not in columns:
                conn.execute(text("ALTER TABLE buttons ADD COLUMN animation_trigger VARCHAR DEFAULT 'always'"))
            conn.commit()


def init_db():
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    run_migrations()
