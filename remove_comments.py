import os
import re

EXTENSIONS = [".py", ".ts", ".tsx"]

IGNORE_DIRS = {
    "node_modules",
    ".next",
    "venv",
    ".venv",
    "__pycache__",
    ".git",
    "dist",
    "build"
}


def remove_comments(content, ext):
    if ext == ".py":

        content = re.sub(r"(?m)^\s*#.*$", "", content)

    elif ext in [".ts", ".tsx"]:

        content = re.sub(r"(?m)^\s*//.*$", "", content)

        content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)

    return content


def process_folder(folder):
    for root, dirs, files in os.walk(folder):

        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

        for file in files:
            ext = os.path.splitext(file)[1]

            if ext in EXTENSIONS:
                path = os.path.join(root, file)

                try:
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()

                    new_content = remove_comments(content, ext)

                    with open(path, "w", encoding="utf-8") as f:
                        f.write(new_content)

                    print(f"Nettoyé : {path}")

                except Exception as e:
                    print(f"Erreur {path} : {e}")


process_folder(".")
print("\nNettoyage terminé.")