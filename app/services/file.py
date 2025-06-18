import os
from typing import List, Optional
from fastapi import UploadFile
from sqlalchemy.orm import Session
from ..models.file_process import FileProcess
from ..models.user import User
from ..schemas.file import FileProcessCreate, FileProcessUpdate

class FileService:
    def __init__(self, db: Session):
        self.db = db
        self.upload_dir = "uploads"

    async def create_file(self, file: UploadFile, user_id: int) -> FileProcess:
        # Créer le dossier d'upload s'il n'existe pas
        os.makedirs(self.upload_dir, exist_ok=True)
        
        # Générer un nom de fichier unique
        file_path = os.path.join(self.upload_dir, file.filename)
        
        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Créer l'entrée dans la base de données
        db_file = FileProcess(
            user_id=user_id,
            original_filename=file.filename,
            file_path=file_path,
            file_size=len(content),
            status='pending',
            process_type='upload'
        )
        
        self.db.add(db_file)
        self.db.commit()
        self.db.refresh(db_file)
        
        return db_file

    def get_file(self, file_id: int) -> Optional[FileProcess]:
        return self.db.query(FileProcess).filter(FileProcess.id == file_id).first()

    def get_user_files(self, user_id: int) -> List[FileProcess]:
        return self.db.query(FileProcess).filter(FileProcess.user_id == user_id).all()

    def update_file(self, file_id: int, file_update: FileProcessUpdate) -> Optional[FileProcess]:
        db_file = self.get_file(file_id)
        if not db_file:
            return None
            
        for key, value in file_update.dict(exclude_unset=True).items():
            setattr(db_file, key, value)
            
        self.db.commit()
        self.db.refresh(db_file)
        return db_file

    def delete_file(self, file_id: int) -> bool:
        db_file = self.get_file(file_id)
        if not db_file:
            return False
            
        # Supprimer le fichier physique
        try:
            os.remove(db_file.file_path)
        except OSError:
            pass  # Le fichier n'existe peut-être pas
            
        # Supprimer l'entrée de la base de données
        self.db.delete(db_file)
        self.db.commit()
        return True 