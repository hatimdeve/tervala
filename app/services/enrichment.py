import pandas as pd

def enrich_with_lookup(df: pd.DataFrame, lookup_column: str, lookup_values: dict) -> pd.DataFrame:
    """Enrichit un DataFrame en remplaçant les valeurs d'une colonne selon un dictionnaire de correspondance."""
    if lookup_column in df.columns:
        df[lookup_column] = df[lookup_column].map(lookup_values).fillna(df[lookup_column])
    return df

def add_concatenated_column(df: pd.DataFrame, source_columns: list, target_column: str, separator: str = " ") -> pd.DataFrame:
    """Ajoute une nouvelle colonne qui est la concaténation de plusieurs colonnes existantes."""
    if all(col in df.columns for col in source_columns):
        df[target_column] = df[source_columns].astype(str).agg(separator.join, axis=1)
    return df 