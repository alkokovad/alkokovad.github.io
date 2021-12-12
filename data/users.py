import sqlalchemy

from .db_session import SqlAlchemyBase


class Users(SqlAlchemyBase):
    __tablename__ = 'users'

    id = sqlalchemy.Column(sqlalchemy.Integer,
                           primary_key=True, autoincrement=True)
    telegram_id = sqlalchemy.Column(sqlalchemy.Integer, nullable=True)
    telegram_tag = sqlalchemy.Column(sqlalchemy.String, nullable=False)
    user_level = sqlalchemy.Column(sqlalchemy.Integer, default=0)
