# SEHATRA Self-Contained Presentation Database Layer
# Bypasses local MongoDB installations to ensure zero runtime freeze states

class MockCollection:
    def __init__(self):
        self.data = []

    def find_one(self, query, projection=None):
        key = list(query.keys())[0]
        val = query[key]
        for item in self.data:
            if item.get(key) == val:
                return item
        return None

    def insert_one(self, document):
        self.data.append(document)
        return document

    def insert_many(self, documents):
        self.data.extend(documents)
        return documents

    def find(self, query, projection=None):
        return self.data

    def delete_many(self, query):
        self.data = []
        return True

# Initialize tables
patients_collection = MockCollection()
inventory_collection = MockCollection()
referrals_collection = MockCollection()
