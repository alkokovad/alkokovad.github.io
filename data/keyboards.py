from telebot import types

from .categories import Categories
from .db_session import *

CATEGORY_BUTTON = 'Категории 📖'
AM_ADD_CAT = 'Добавить категорию'
AM_CHANGE_CAT = 'Изменить категорию'
AM_DELETE_CAT = 'Удалить категорию'


def construct_buttons(event):
    buttons_from_database = []
    if event == 'start':
        buttons_from_database = [types.InlineKeyboardButton(text=button)
                                 for button in construct_start_buttons()]
    if event == 'categories':
        buttons_from_database = [types.InlineKeyboardButton(text=button)
                                 for button in construct_categories_buttons()]
        buttons_from_database.append(types.InlineKeyboardButton(text='Назад в меню'))
    if event == 'admin_menu':
        buttons_from_database = [types.InlineKeyboardButton(text=button)
                                 for button in construct_admin_menu_buttons()]
    return buttons_from_database


def get_start_buttons():
    buttons = construct_buttons('start')
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(*buttons)
    return keyboard


def construct_start_buttons():
    return [CATEGORY_BUTTON]


def get_categories_buttons():
    buttons = construct_buttons('categories')
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(*buttons)
    return keyboard


def construct_categories_buttons():
    db_connect()
    db_sess = create_session()
    categories = [cat.category_name for cat in db_sess.query(Categories).all()]
    return categories


def get_admin_menu_buttons(super_user):
    buttons = construct_buttons('admin_menu')
    if super_user:
        buttons.append(types.InlineKeyboardButton(text='Добавить админа'))
        buttons.append(types.InlineKeyboardButton(text='Удалить админа'))
    keyboard = types.ReplyKeyboardMarkup(resize_keyboard=True)
    keyboard.add(*buttons)
    return keyboard


def construct_admin_menu_buttons():
    return [AM_ADD_CAT, AM_CHANGE_CAT, AM_DELETE_CAT]


def back_to_admin_menu_button():
    keyboard = types.ReplyKeyboardMarkup()
    keyboard.add(types.InlineKeyboardButton(text='Назад в меню'))
    return keyboard


def db_connect():
    db_name = 'db/db.sqlite'
    global_init(db_name)
