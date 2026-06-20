import socket


def prefer_ipv4() -> None:
    """Docker often has no IPv6 route — urllib/aiohttp may fail with Errno 101."""
    try:
        import urllib3.util.connection as urllib3_connection

        urllib3_connection.allowed_gai_family = lambda: socket.AF_INET
    except Exception:
        pass
