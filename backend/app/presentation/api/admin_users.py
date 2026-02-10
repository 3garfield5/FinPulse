from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.application.interfaces.user import IUserRepository
from app.infrastructure.dependencies import get_user_repo
from app.infrastructure.security.authz import require_permissions
from app.infrastructure.database.base import SessionLocal
from app.infrastructure.database.models import UserModel, RoleModel, UserRoleModel

router = APIRouter(prefix="/admin/users", tags=["AdminUsers"])

class SetRolesIn(BaseModel):
    roles: list[str] = Field(min_length=1)

@router.put("/{user_id}/roles", dependencies=[Depends(require_permissions(["admin_users:assign_role"]))])
def set_roles(user_id: int, payload: SetRolesIn, repo: IUserRepository = Depends(get_user_repo)):
    try:
        roles = repo.set_roles(user_id, payload.roles)
        return {"user_id": user_id, "roles": sorted(roles)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", dependencies=[Depends(require_permissions(["admin_users:list"]))])
def list_users():
    with SessionLocal() as session:
        users = session.query(UserModel).order_by(UserModel.id.desc()).all()

        user_ids = [u.id for u in users]
        role_rows = (
            session.query(UserRoleModel.user_id, RoleModel.name)
            .join(RoleModel, RoleModel.id == UserRoleModel.role_id)
            .filter(UserRoleModel.user_id.in_(user_ids))
            .all()
        )

        roles_map: dict[int, list[str]] = {}
        for uid, rname in role_rows:
            roles_map.setdefault(uid, []).append(rname)

        return [
            {
                "id": u.id,
                "email": u.email,
                "roles": sorted(roles_map.get(u.id, [])),
            }
            for u in users
        ]