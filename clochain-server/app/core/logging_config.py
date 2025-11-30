LOGGING_CONFIG = {
  "version": 1,
  "disable_existing_loggers": False,
  "formatters": {
    "default": {
      "format": "[%(levelname)s] %(asctime)s %(name)s:%(lineno)d | %(message)s",
    },
  },
  "handlers": {
    "default": {
      "level": "DEBUG",
      "formatter": "default",
      "class": "logging.StreamHandler",
    },
  },
  "loggers": {
    "uvicorn": {"handlers": ["default"], "level": "DEBUG"},
    "uvicorn.error": {"handlers": ["default"], "level": "DEBUG"},
    "uvicorn.access": {"handlers": ["default"], "level": "INFO", "propagate": False},
    "app": {"handlers": ["default"], "level": "DEBUG"},
  },
}
