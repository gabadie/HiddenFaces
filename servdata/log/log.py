import logging

logformat = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
logfilename = 'servdata_log.log'
loglevel = logging.DEBUG

def get_logger(fileName):

    logger = logging.getLogger(fileName)
    logger.setLevel(loglevel)

    #log to file
    file_log_handler = logging.FileHandler(logfilename)
    file_log_handler.setLevel(loglevel)
    logger.addHandler(file_log_handler)

    #stdout output
    stderr_log_handler = logging.StreamHandler()
    stderr_log_handler.setLevel(loglevel)
    logger.addHandler(stderr_log_handler)

    # nice output format
    formatter = logging.Formatter(logformat)
    file_log_handler.setFormatter(formatter)
    stderr_log_handler.setFormatter(formatter)

    return logger



