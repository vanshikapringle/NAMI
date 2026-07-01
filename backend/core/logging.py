import logging
import sys

def setup_logging(log_level: str = "INFO") -> None:
    """
    Configure global structured logging for NAMI V2 backend services.
    Ensures standard format across application modules.
    """
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    logger = logging.getLogger("nami_backend")
    logger.info("NAMI V2 structured logging initialized.")
