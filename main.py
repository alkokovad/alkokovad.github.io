import telebot

from data.keyboards import *
from data.users import Users

bot = telebot.TeleBot('5052901057:AAHK3BIcpcLQ_FG_1FcXrKdj15x96uMXBIs')


@bot.message_handler(commands=['start'])
def start(message):
    cid = message.chat.id
    check_user(message)
    send_message = bot.send_message(cid, 'Этот бот что-то умеет.',
                                    reply_markup=get_start_buttons())
    bot.register_next_step_handler(
        send_message,
        start_menu_buttons_hub,
        send_message.chat.id,
        send_message.message_id)


def check_user(message):
    db_sess = create_session()
    if not db_sess.query(Users).filter(Users.telegram_id == message.from_user.id).all():
        user = Users(telegram_id=message.from_user.id,
                     telegram_tag=message.chat.username)
        db_sess.add(user)
        db_sess.commit()


def start_menu_buttons_hub(message, cid,  mid):
    if message.text == 'Категории 📖':
        bot.delete_message(cid, mid)
        bot.delete_message(cid, mid + 1)
        keyboard = get_categories_buttons()
        send_message = bot.send_message(cid, 'типа вот твои прекрасные категории, выбирай:',
                                        reply_markup=keyboard)
        bot.register_next_step_handler(send_message,
                                       games_by_category,
                                       send_message.chat.id,
                                       send_message.message_id)


def games_by_category(message, cid, mid):
    if message.text == 'Назад в меню':
        back_to_start_menu(message, cid, mid)
        return
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)


@bot.message_handler(commands=['admin'])
def admin_start(message):
    cid = message.chat.id
    user_id = message.from_user.id
    db_sess = create_session()
    user = db_sess.query(Users).filter(Users.telegram_id == user_id).all()[0]
    if user.user_level == 0:
        bot.send_message(cid, 'Слышь тебе сюда нельзя.')
        return
    elif user.user_level == 1:
        keyboard = get_admin_menu_buttons(False)
        send_message = bot.send_message(cid, 'Ваше меню:',
                                        reply_markup=keyboard)
        bot.register_next_step_handler(send_message,
                                       admin_menu_hub_function,
                                       send_message.chat.id,
                                       send_message.message_id)
    elif user.user_level == 2:
        keyboard = get_admin_menu_buttons(True)
        send_message = bot.send_message(cid, 'Ваше меню, господин:',
                                        reply_markup=keyboard)
        bot.register_next_step_handler(send_message,
                                       admin_menu_hub_function,
                                       send_message.chat.id,
                                       send_message.message_id)


def admin_menu_hub_function(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    keyboard = get_categories_buttons()
    if message.text == 'Добавить категорию':
        send_message = bot.send_message(cid, 'Дайте название категории и я её добавлю:')
        bot.register_next_step_handler(send_message,
                                       add_cat,
                                       send_message.chat.id,
                                       send_message.message_id)
    if message.text == 'Изменить категорию':
        send_message = bot.send_message(cid, 'Выберите категории и я помогу вам её изменить:',
                                        reply_markup=keyboard)
        bot.register_next_step_handler(send_message,
                                       prechange_cat,
                                       send_message.chat.id,
                                       send_message.message_id)
    if message.text == 'Удалить категорию':
        send_message = bot.send_message(cid, 'выберите категорию и я её удалю:',
                                        reply_markup=keyboard)
        bot.register_next_step_handler(send_message,
                                       delete_cat,
                                       send_message.chat.id,
                                       send_message.message_id)
    if message.text == 'Добавить админа':
        send_message = bot.send_message(cid, 'Напишите тэг админа в телеграме:')
        bot.register_next_step_handler(send_message,
                                       add_admin,
                                       send_message.chat.id,
                                       send_message.message_id)

    if message.text == 'Удалить админа':
        send_message = bot.send_message(cid, 'Напишите тэг админа в телеграме:')
        bot.register_next_step_handler(send_message,
                                       delete_admin,
                                       send_message.chat.id,
                                       send_message.message_id)


def add_cat(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    db_sess = create_session()
    new_cat = Categories(category_name=message.text)
    db_sess.add(new_cat)
    send_message = bot.send_message(cid, f'Ваша категория "{message.text}" создана!',
                                    reply_markup=back_to_admin_menu_button())
    bot.register_next_step_handler(send_message,
                                   back_to_admin_menu,
                                   send_message.chat.id,
                                   send_message.message_id)
    db_sess.commit()


def prechange_cat(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    send_message = bot.send_message(cid, 'Хорошо, теперь дайте ей новое название:')
    bot.register_next_step_handler(send_message,
                                   change_cat,
                                   send_message.chat.id,
                                   send_message.message_id,
                                   message.text)


def change_cat(message, cid, mid, cat_name):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    db_sess = create_session()
    editing_cat = db_sess.query(Categories).filter(Categories.category_name == cat_name).first()
    editing_cat.category_name = message.text
    send_message = bot.send_message(cid, f'Ваша категория "{cat_name}" изменена на "{message.text}"',
                                    reply_markup=back_to_admin_menu_button())
    bot.register_next_step_handler(send_message,
                                   back_to_admin_menu,
                                   send_message.chat.id,
                                   send_message.message_id)
    db_sess.commit()


def delete_cat(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    db_sess = create_session()
    category = db_sess.query(Categories).filter(Categories.category_name == message.text).first()
    db_sess.delete(category)
    send_message = bot.send_message(cid, f'Ваша категория "{message.text}" удалена!',
                                    reply_markup=back_to_admin_menu_button())
    bot.register_next_step_handler(send_message,
                                   back_to_admin_menu,
                                   send_message.chat.id,
                                   send_message.message_id)
    db_sess.commit()


def add_admin(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    tg_id = message.text
    db_sess = create_session()
    new_adm = db_sess.query(Users).filter(Users.telegram_tag == tg_id).first()
    new_adm.user_level = 1
    db_sess.commit()
    send_message = bot.send_message(cid, f'Вы добавили админа {message.text}',
                                    reply_markup=back_to_admin_menu_button())
    bot.register_next_step_handler(send_message,
                                   back_to_admin_menu,
                                   send_message.chat.id,
                                   send_message.message_id)


def delete_admin(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    tg_id = message.text
    db_sess = create_session()
    deleting_adm = db_sess.query(Users).filter(Users.telegram_tag == tg_id).first()
    deleting_adm.user_level = 0
    db_sess.commit()
    send_message = bot.send_message(cid, f'Админ {message.text} удалён!',
                                    reply_markup=back_to_admin_menu_button())
    bot.register_next_step_handler(send_message,
                                   back_to_admin_menu,
                                   send_message.chat.id,
                                   send_message.message_id)


def back_to_admin_menu(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    admin_start(message)


def back_to_start_menu(message, cid, mid):
    bot.delete_message(cid, mid)
    bot.delete_message(cid, mid + 1)
    start(message)


@bot.message_handler(commands=['game'])
def game_sending(message):
    cid = message.chat.id
    bot.send_game(cid, 'fucked_up_game')


@bot.callback_query_handler(func=lambda call: True)
def game_jump(call):
    bot.answer_callback_query(call.id, url='http://jrgrafton.github.io/asteroids/production/')


def db_connect():
    db_name = 'db/db.sqlite'
    global_init(db_name)


if __name__ == '__main__':
    db_connect()
    while True:
        try:
            bot.polling()
        except Exception as e:
            print(f'Error - {e}')
