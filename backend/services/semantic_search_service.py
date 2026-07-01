import logging
from typing import List
from models.schemas import SearchRequestSchema, SearchResponseSchema, SearchResultItemSchema
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

class SemanticSearchService:
    """
    Interface for semantic vector search over archived travel memories.
    Uses TF-IDF + Latent Semantic Analysis (LSA) for robust local topic matching.
    """
    @staticmethod
    def search_memories(request: SearchRequestSchema) -> SearchResponseSchema:
        logger.info(f"Executing semantic search for query: '{request.query}' (limit={request.limit})")
        
        memories = request.memories or []
        if not memories:
            return SearchResponseSchema(query=request.query, total_results=0, results=[])

        # Prepare corpus documents by fusing key semantic fields
        documents = []
        for m in memories:
            text_parts = [
                m.get("title", ""),
                m.get("description", ""),
                m.get("location_name", ""),
                m.get("category", ""),
                m.get("notes", ""),
                m.get("favorite_moment", "")
            ]
            documents.append(" ".join(filter(None, text_parts)).lower())

        # 1. TF-IDF Vectorization
        vectorizer = TfidfVectorizer(stop_words='english')
        try:
            tfidf_matrix = vectorizer.fit_transform(documents)
        except ValueError:
            # Fallback if no valid vocab
            return SearchResponseSchema(query=request.query, total_results=0, results=[])

        # 2. Dimensionality Reduction (LSA / LSI) to understand latent concepts
        n_components = min(100, len(memories) - 1)
        if n_components < 1:
            n_components = 1
            
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        lsa_matrix = svd.fit_transform(tfidf_matrix)

        # 3. Vectorize Query
        query_tfidf = vectorizer.transform([request.query.lower()])
        query_lsa = svd.transform(query_tfidf)

        # 4. Compute Cosine Similarity
        similarities = cosine_similarity(query_lsa, lsa_matrix)[0]

        # 5. Rank Results
        ranked_indices = np.argsort(similarities)[::-1]
        
        results: List[SearchResultItemSchema] = []
        for idx in ranked_indices:
            score = float(similarities[idx])
            # Only include relevant matches (similarity > 0.05)
            if score > 0.05:
                mem = memories[idx]
                results.append(SearchResultItemSchema(
                    memory_id=mem.get("id", ""),
                    title=mem.get("title", "Untitled"),
                    location=mem.get("location_name", "Unknown"),
                    caption=mem.get("description", ""),
                    similarity_score=score
                ))
            
            if len(results) >= request.limit:
                break

        return SearchResponseSchema(
            query=request.query,
            total_results=len(results),
            results=results
        )
