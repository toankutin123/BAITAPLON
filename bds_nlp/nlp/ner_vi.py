from underthesea import ner

def extract_location(text):
    try:
        entities = ner(text)
        locations = [word for word, tag in entities if tag == "B-LOC"]
        return " ".join(locations) if locations else None
    except:
        return None