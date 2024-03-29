
// -------------------------------------------------------- NOTIFICATION SERVICE
/*
 * Notifications' virtual table: it contains one interface for each
 * notifications
 *
 * @param <notification_json>: the received notification
 * function automation(notification_json)
 * {
 *     // code called once the notificatio has just been received.
 * }
 *
 * @param <notification_json>: the received notification
 * function resolve(notification_json, callback)
 * {
 *     // code to export a notification's JSON to a real notification.
 *
 *     // return the notification
 *     callback(notification)
 * }
 */
hf_service.notification_interface = {};

/*
 * Defines a new notification type in the notifications' virtual table
 *
 * @param <notification_type>: the notification type. (ex: '/notification/message')
 * @param <calls>: an interface containing the automation and resolve functions.
 */
hf_service.define_notification = function(notification_type, notification_interface)
{
    assert(hf.is_function(notification_interface.automation) || notification_interface.automation == null);
    assert(hf.is_function(notification_interface.resolve) || notification_interface.resolve == null);
    assert(!(notification_type in hf_service.notification_interface));

    hf_service.notification_interface[notification_type] = notification_interface;
}

/*
 * Tests if a chunk content has a notification repository
 *
 * @param <repository_chunk>: is the chunk's content where to test the notification
 *      repository.
 *
 * @returns true or false.
 */
hf_service.has_notification_repository = function(repository_chunk)
{
    if (!('system' in repository_chunk))
    {
        return false;
    }
    else if (!('chunks_owner' in repository_chunk['system']))
    {
        return false;
    }

    return ('notifications' in repository_chunk);
}

/*
 * Inits a notification repository into a given repository chunk.
 *
 * @param <repository_chunk>: is the chunk's content where to init the notification
 *      repository.
 * @param <transaction>: the transaction in charge of creating <repository_chunk>
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.init_notification_repository = function(repository_chunk, transaction, callback)
{
    assert('system' in repository_chunk);
    assert('chunks_owner' in repository_chunk['system']);
    assert(typeof repository_chunk['system']['chunks_owner'] == 'string');
    assert(!hf_service.has_notification_repository(repository_chunk));
    assert(hf.is_function(callback));

    hf_com.generate_RSA_key(function(notification_chunk_private_key, notification_chunk_public_key)
    {
        var notification_chunk_name = hf.generate_hash('qUaMF8HtvLUtsXArCfhU');

        repository_chunk['system']['protected_chunk'] = {
            'name':         notification_chunk_name,
            'private_key':  notification_chunk_private_key,
            'public_key':   notification_chunk_public_key
        },

        /*
         * pending notifications that have already been fetched but don't have
         * automated process and are waiting for the user to be processed.
         */
        repository_chunk['notifications'] = [ ];

        // Creates the user's protected chunk
        transaction.create_data_chunk(
            notification_chunk_name,
            repository_chunk['system']['chunks_owner'],
            '',
            [],
            true
        );

        assert(hf_service.has_notification_repository(repository_chunk));

        callback(true);
    });
}

/*
 * Exports a public notification repository from a notification repository
 *
 * @param <repository_chunk>: the chunk content containing the
 *      notification repository
 * @param <public_repository_chunk>: the chunk content where to export the
 *      public notification repository
 */
hf_service.export_public_notification_repository = function(repository_chunk, public_repository_chunk)
{
    assert(hf_service.has_notification_repository(repository_chunk));
    assert('system' in public_repository_chunk);

    public_repository_chunk['system']['protected_chunk'] = {
        'name':         repository_chunk['system']['protected_chunk']['name'],
        'public_key':   repository_chunk['system']['protected_chunk']['public_key']
    };
}

/*
 * Pushs a notification to an user's protected chunk
 *
 * @param <repository_chunk>: the chunk content containing the
 *      public notification repository
 * @param <notification_json>: the notification JSON to push
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.push_notification = function(public_repository_chunk, notification_json, callback)
{
    assert(hf_service.is_connected());
    assert('system' in public_repository_chunk);
    assert('protected_chunk' in public_repository_chunk['system']);
    assert(typeof notification_json['__meta']['type'] == 'string');
    assert(notification_json['__meta']['type'] in hf_service.notification_interface);
    assert((notification_json['__meta']['author_user_hash'] == hf_service.user_hash()) || hf_service.is_group_admin(notification_json['__meta']['author_user_hash']));
    assert(hf.is_function(callback));

    notification_json['__meta']['date'] = hf.get_date_time();

    // appends the notification to the end of <user_hash>'s protected file
    hf_com.append_data_chunk(
        public_repository_chunk['system']['protected_chunk']['name'],
        hf_service.user_chunks_owner(),
        public_repository_chunk['system']['protected_chunk']['public_key'],
        JSON.stringify(notification_json),
        function(json_message) {
            if (json_message['status'] != 'ok')
            {
                allert(
                    'hf_service.push_notification(' +
                    user_hash + ', ' +
                    JSON.stringify(notification_json) +
                    ') failed'
                );
                callback(false);
                return;
            }

            callback(true);
        }
    );
}

/*
 * Deletes a notification with its hash
 *
 * @param <repository_chunk>: the chunk content containing the
 *      notification repository
 * @param <notification_hash>: the notification's hash to delete
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.delete_notification = function(repository_chunk, notification_hash, callback)
{
    assert(hf_service.has_notification_repository(repository_chunk));
    assert(hf.is_hash(notification_hash));
    assert(hf.is_function(callback));

    var notifications_json = repository_chunk['notifications'];

    for (var i = 0; i < notifications_json.length; i++)
    {
        var notification_json = notifications_json[i];

        assert(hf.is_hash(notification_json['__meta']['hash']));

        if (notification_json['__meta']['hash'] != notification_hash)
        {
            continue;
        }

        notifications_json.splice(i, 1);

        callback(true);

        return;
    }

    callback(false);
}

/*
 * Processes notifications automations on given notification json.
 *
 * @param <repository_chunk> : the repository containing the notifications
 * @param <notifications_json>: the notifications to process
 * @param <callback>: the function called once done
 *      @param <continued_notifications_json>: the notifications that made it
 *          throught
 *      function my_callback(continued_notifications_json)
 */
hf_service.process_notifications = function(repository_chunk,notifications_json, callback)
{
    assert(hf.is_function(callback));

    var continued_notifications_json = [];

    for (var i = 0; i < notifications_json.length; i++)
    {
        var notification_json = notifications_json[i];
        var notificationType = notification_json['__meta']['type'];

        assert(notificationType in hf_service.notification_interface);

        var notificationAutomation = hf_service.notification_interface[notificationType].automation;

        if (notificationAutomation != null)
        {
            assert(hf.is_function(notificationAutomation));

            status = notificationAutomation(notification_json,repository_chunk);

            assert(typeof status == 'string');

            if (status == 'discard')
            {
                continue;
            }

            assert(status == 'continue');
        }

        /*
         * We store this notification into the user's private chunk
         */
        if (!('hash' in notification_json['__meta']))
        {
            notification_json['__meta']['hash'] = hf.generate_hash(
                JSON.stringify(notification_json)
            );
        }

        continued_notifications_json.push(notification_json);
    }

    callback(continued_notifications_json);
}

/*
 * Pulls fresh notifications, processes automated one and stores the remaining
 * into the notification repository.
 *
 * @param <repository_chunk>: the chunk content containing the
 *      notification repository
 * @param <callback>: the function called once done
 *      @param <modification_count>: the number of modification
 *      function my_callback(modification_count)
 */
hf_service.pull_fresh_notifications = function(repository_chunk, callback)
{
    assert(hf.is_function(callback) || callback == undefined);
    assert(hf_service.has_notification_repository(repository_chunk));

    var transaction = new hf_com.Transaction();
    var protected_chunk_name =
        repository_chunk['system']['protected_chunk']['name'];

    transaction.get_data_chunk(
        protected_chunk_name,
        repository_chunk['system']['protected_chunk']['private_key']
    );
    transaction.write_data_chunk(
        protected_chunk_name,
        repository_chunk['system']['chunks_owner'],
        '',
        []
    );

    transaction.commit(function(json_message){
        if (json_message['status'] != 'ok')
        {
            assert(hf.is_function(callback));
            callback(null);
            return;
        }

        var notification_chunk_content = json_message['chunk'][protected_chunk_name];
        var notifications_json = [];

        for (var i = 0; i < notification_chunk_content.length; i++)
        {
            var notification_json = null;

            try
            {
                notification_json = JSON.parse(notification_chunk_content[i]);

                /*
                 * TODO: need to validate the notification in case someone else has
                 * appened an invalid one (issue #27).
                 */

                var notificationType = notification_json['__meta']['type'];

                assert(notificationType in hf_service.notification_interface);
            }
            catch (err)
            {
                continue;
            }

            assert(notification_json != null);

            notifications_json.push(notification_json);
        }

        repository_chunk['notifications'] =
            repository_chunk['notifications'].concat(notifications_json);

        hf_service.refresh_notifications(
            repository_chunk,
            function(discarded_count)
            {
                if (callback)
                {
                    callback(discarded_count + notifications_json.length);
                }
            }
        );
    });
}

/*
 * Lists user notifications
 *
 * @param <repository_chunk>: the chunk content containing the
 *      notification repository
 * @param <callback>: the function called once done
 *      @param <notifications_list>: the resolved notifications list or null
 *      function my_callback(notifications_list, modified_repository)
 */
hf_service.list_notifications = function(repository_chunk, callback)
{
    assert(hf_service.has_notification_repository(repository_chunk));
    assert(hf.is_function(callback));

    hf_service.pull_fresh_notifications(repository_chunk, function(notifications_count){
        if (notifications_count == null)
        {
            /*
             * hf_service.pull_fresh_notifications() failed so we fail
             * hf_service.list_notifications().
             */
            callback(null, false);
            return;
        }

        var notifications = [];
        var callbacks_remaining = repository_chunk['notifications'].length;

        var notifications_json = repository_chunk['notifications'];

        for (var i = 0; i < notifications_json.length; i++)
        {
            var notification_json = notifications_json[i];

            assert(notification_json['__meta']['type'] in hf_service.notification_interface);

            hf_service.notification_interface[notification_json['__meta']['type']].resolve(
                notification_json,
                function(notification)
                {
                    if (notification)
                    {
                        notifications[notifications.length] = notification;
                    }

                    callbacks_remaining--;

                    if (callbacks_remaining == 0)
                    {
                        callback(notifications, notifications_count > 0);
                    }
                }
            );
        }

        if (notifications_json.length == 0)
        {
            callback(notifications, notifications_count > 0);
        }
    });
}


/*
 * Pushs a notification to an user's protected chunk
 *
 * @param <repository_chunk>: the chunk content containing the
 *      public notification repository
 * @param <notification_json>: the notification JSON to push
 * @param <callback>: the callback once the notification has been pushed
 *      @param <discarded_count>: number of discarded notifications
 *      function my_callback(discarded_count)
 */
hf_service.refresh_notifications = function(repository_chunk, callback)
{
    assert(hf_service.has_notification_repository(repository_chunk));
    assert(hf.is_function(callback));

    var notifications_json = repository_chunk['notifications'];

    hf_service.process_notifications(repository_chunk,notifications_json, function(survived_notifications_json){
        assert(survived_notifications_json.length <= notifications_json.length);

        repository_chunk['notifications'] = survived_notifications_json;

        callback(notifications_json.length - survived_notifications_json.length);
    });
}


// --------------------------------------------------- USER NOTIFICATION SERVICE
/*
 * Pushs a user notification to an user's protected chunk
 *
 * @param <user_hash>: the user's hash
 * @param <notification_json>: the notification JSON to push
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.push_user_notification = function(user_hash, notification_json, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(user_hash));

    // Gets <user_hash>'s public chunk to find <user_hash>'s protected file
    hf_service.get_user_public_chunk(user_hash, function(public_chunk){
        if (!public_chunk)
        {
            callback(false);
            return;
        }

        hf_service.push_notification(public_chunk, notification_json, callback);
    });
}

/*
 * Deletes an user notification with its hash
 *
 * @param <notification_hash>: the notification's hash to delete
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.delete_user_notification = function(notification_hash, callback)
{
    assert(hf_service.is_connected());

    hf_service.delete_notification(
        hf_service.user_private_chunk,
        notification_hash,
        function(success)
        {
            if (success)
            {
                hf_service.save_user_chunks(callback);
            }
            else
            {
                callback(false);
            }
        }
    );
}

/*
 * Pulls fresh user's notifications, processes automated one and stores the remaining
 * into the user's private chunk.
 *
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.pull_fresh_user_notifications = function(callback)
{
    assert(hf_service.is_connected());

    hf_service.pull_fresh_notifications(
        hf_service.user_private_chunk,
        function(modification_count)
        {
            if (modification_count == null)
            {
                assert(hf.is_function(callback));
                callback(false);
            }
            else if (modification_count == 0)
            {
                if (callback)
                    callback(true);
            }
            else
            {
                assert(modification_count > 0);

                hf_service.save_user_chunks(callback);
            }
        }
    );
}

/*
 * Lists user's notifications
 *
 * @param <callback>: the function called once done
 *      @param <notifications_list>: the list of notifications or null
 *      function my_callback(notifications_list)
 */
hf_service.list_user_notifications = function(callback)
{
    assert(hf.is_function(callback));

    hf_service.list_notifications(hf_service.user_private_chunk, function(notifications_list, modified_repository){
        if (notifications_list == null)
        {
            callback(null);
            return;
        }

        var todo = function(success){
            if (!success)
            {
                callback(null);
                return;
            }

            notifications_list.sort(function(notification_a, notification_b){
                if (notification_a['__meta']['date'] > notification_b['__meta']['date'])
                {
                    return -1;
                }
                else if (notification_a['__meta']['date'] < notification_b['__meta']['date'])
                {
                    return 1;
                }

                return 0;
            });

            callback(notifications_list);
        }

        if (!modified_repository)
        {
            todo(true);
            return;
        }

        hf_service.save_user_chunks(todo);
    });
}

hf_service.list_group_notifications = function(group_hash, callback)
{
    assert(hf.is_function(callback));
    assert(hf_service.is_group_admin(group_hash));

    hf_service.get_group_private_chunk(group_hash, function(private_chunk_group){
        hf_service.list_notifications(private_chunk_group, function(notifications_list, modified_repository){
        if (notifications_list == null)
        {
            callback(null);
            return;
        }

        var todo = function(success){
            if (!success)
            {
                callback(null);
                return;
            }

            notifications_list.sort(function(notification_a, notification_b){
                if (notification_a['__meta']['date'] > notification_b['__meta']['date'])
                {
                    return -1;
                }
                else if (notification_a['__meta']['date'] < notification_b['__meta']['date'])
                {
                    return 1;
                }

                return 0;
            });

            callback(notifications_list);
        }

        if (!modified_repository)
        {
            todo(true);
            return;
        }

        hf_service.save_user_chunks(todo);
    });
    });
}


// ------------------------------------------------ NOTIFICATION IMPLEMENTATIONS

/*
 * Generic notification resolver adding the ['author'] key fetched frorm the
 * ['__meta']['author_user_hash']
 */
hf_service.resolve_notification_author = function(notification_json, callback)
{
    assert(hf.is_function(callback));

    hf_service.get_user_public_chunk(
        notification_json['__meta']['author_user_hash'],
        function(user_public_chunk)
        {
            if (user_public_chunk == null)
            {
                callback(null);
                return;
            }

            var notification = hf.clone(notification_json);

            notification['author'] = user_public_chunk;

            callback(notification);
        }
    );
}

/*
 * Define a notification interface for /notification/message
 */
hf_service.define_notification('/notification/message', {
    automation: null,
    resolve: hf_service.resolve_notification_author
});


/*
 * Sends message to an user. Might be use for that user to add the currently
 * connected user as a contact.
 *
 * @params <user_has>: user's hash we want to send the message
 * @params <message>: message to send to 2nd user
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_message = function(user_hash, message, callback)
{
    assert(hf_service.is_connected(), "user not connected in hf_service.send_contact_request");
    assert(hf.is_function(callback));

    if (user_hash == hf_service.user_hash())
    {
        callback(false);
        return;
    }

    var notification_json = {
        '__meta': {
            'type': '/notification/message',
            'author_user_hash': hf_service.user_hash()
        },
        'content': message
    };

    hf_service.push_user_notification(user_hash, notification_json, callback);
}

