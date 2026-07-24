import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL    = os.getenv("DATABASE_URL")
JWT_SECRET      = os.getenv("JWT_SECRET")
JWT_ALGORITHM   = os.getenv("JWT_ALGORITHM", "HS256")
DOMAIN          = os.getenv("DOMAIN", "veilix.fr")
EMAIL_PROVIDER  = os.getenv("EMAIL_PROVIDER", "mailgun")
MAILGUN_API_KEY = os.getenv("MAILGUN_API_KEY")
MAILGUN_DOMAIN  = os.getenv("MAILGUN_DOMAIN")
AWS_ACCESS_KEY  = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY  = os.getenv("AWS_SECRET_KEY")
AWS_REGION      = os.getenv("AWS_REGION", "eu-west-1")
