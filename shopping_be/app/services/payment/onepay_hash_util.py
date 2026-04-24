"""
OnePay secure hash utility — exact port of OnePaySecureHashUtil.java.

Hash algorithm: HMAC-SHA256
Secret encoding: hex string → raw bytes (parseHexBinary)
Parameter filtering: vpc_* and user_* prefixes only,
                     excluding vpc_SecureHash, vpc_SecureHashType, empty values
Sort order: alphabetical (equivalent to Java TreeMap natural ordering)
Raw data: key=value pairs joined by "&" WITHOUT URL-encoding
Output: uppercase hex string
"""
import hmac
import hashlib
import binascii
from urllib.parse import quote


def _parse_hex_binary(s: str) -> bytes:
    if len(s) % 2 != 0:
        raise ValueError("Hex string must have even length")
    return binascii.unhexlify(s)


def _print_hex_binary(data: bytes) -> str:
    return binascii.hexlify(data).decode("ascii").upper()


def create_secure_hash(params: dict, secure_secret: str) -> str:
    sorted_params: dict = {}
    for key, value in params.items():
        if not (key.startswith("vpc_") or key.startswith("user_")):
            continue
        if key in ("vpc_SecureHash", "vpc_SecureHashType"):
            continue
        if not value:
            continue
        sorted_params[key] = value

    raw_data = "&".join(
        f"{k}={v}" for k, v in sorted(sorted_params.items())
    )

    key_bytes = _parse_hex_binary(secure_secret)
    mac = hmac.new(key_bytes, raw_data.encode("utf-8"), hashlib.sha256)
    return _print_hex_binary(mac.digest())


def verify_secure_hash(params: dict, secure_secret: str, received_hash: str) -> bool:
    if not received_hash:
        return False
    calculated = create_secure_hash(params, secure_secret)
    return calculated.upper() == received_hash.upper()


def build_query_string(params: dict) -> str:
    parts = []
    for key, value in params.items():
        encoded = quote(str(value) if value is not None else "", safe="")
        parts.append(f"{key}={encoded}")
    return "&".join(parts)
