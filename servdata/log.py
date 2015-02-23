import logging

def get_logger(filename,testing=False):
    log_format = '[%(asctime)s] %(levelname)s - %(message)s'
    log_formatter = logging.Formatter(log_format)

    logger = logging.getLogger(__name__)
    logger.setLevel(logging.DEBUG)

    handler = logging.FileHandler(filename)
    handler.setFormatter(log_formatter)
    logger.addHandler(handler)

    if(testing):
        stderr_log_handler = logging.StreamHandler()
        stderr_log_handler.setLevel(logging.DEBUG)
        stderr_log_handler.setFormatter(log_formatter)
        logger.addHandler(stderr_log_handler)

    return logger