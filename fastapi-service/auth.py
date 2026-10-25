import jwt
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import JWT_SECRET

bearer = HTTPBearer(auto_error=False)


def current_user_id(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> ObjectId:
    """Checks the JWT created by the Express backend and returns the user's id.

    The frontend sends:  Authorization: Bearer <token>
    The token payload is { "id": "<user id>", "iat": ..., "exp": ... } signed with HS256.
    """
    if credentials is None:
        raise HTTPException(status_code=401, detail="Please log in first")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        return ObjectId(payload["id"])
    except (jwt.PyJWTError, KeyError, InvalidId):
        # Wrong signature, expired token or broken token
        raise HTTPException(status_code=401, detail="Your session has expired, please log in again")
