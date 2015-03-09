
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
 * Pushs a notification to an user's protected chunk
 *
 * @param <user_hash>: the user's hash
 * @param <notification_json>: the notification JSON to push
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.push_notification = function(user_hash, notification_json, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(user_hash));
    assert(typeof notification_json['__meta']['type'] == 'string');
    assert(notification_json['__meta']['type'] in hf_service.notification_interface);
    assert(notification_json['__meta']['author_user_hash'] == hf_service.user_hash());
    assert(hf.is_function(callback));

    // Gets <user_hash>'s public chunk to find <user_hash>'s protected file
    hf_service.get_user_public_chunk(user_hash, function(public_chunk){
        if (!public_chunk)
        {
            callback(false);
            return;
        }

        // appends the notification to the end of <user_hash>'s protected file
        hf_com.append_data_chunk(
            public_chunk['system']['protected_chunk']['name'],
            hf_service.user_chunks_owner(),
            public_chunk['system']['protected_chunk']['public_key'],
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
        )
    });
}

/*
 * Deletes a notification with its hash
 *
 * @param <notification_hash>: the notification's hash to delete
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.delete_user_notification = function(notification_hash, callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_hash(notification_hash));
    assert(hf.is_function(callback));

    var notifications_json = hf_service.user_private_chunk['notifications'];

    for (var i = 0; i < notifications_json.length; i++)
    {
        var notification_json = notifications_json[i];

        assert(hf.is_hash(notification_json['__meta']['hash']));

        if (notification_json['__meta']['hash'] != notification_hash)
        {
            continue;
        }

        notifications_json.splice(i, 1);

        hf_service.save_user_chunks(function(success){
            callback(success);
        });

        return;
    }

    callback(false);
}

/*
 * Pulls fresh notifications, processes automated one and stores the remaining
 * into the user's private chunk.
 *
 * @param <callback>: the function called once done
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.pull_fresh_user_notifications = function(callback)
{
    assert(hf_service.is_connected());
    assert(hf.is_function(callback) || callback == undefined);

    var transaction = new hf_com.Transaction();
    var protected_chunk_name =
        hf_service.user_private_chunk['system']['protected_chunk']['name'];

    transaction.get_data_chunk(
        protected_chunk_name,
        hf_service.user_private_chunk['system']['protected_chunk']['private_key']
    );
    transaction.write_data_chunk(
        protected_chunk_name,
        hf_service.user_chunks_owner(),
        '',
        []
    );

    transaction.commit(function(json_message){
        if (json_message['status'] != 'ok')
        {
            assert(hf.is_function(callback));
            callback(false);
            return;
        }

        var notifications_json = json_message['chunk'][protected_chunk_name];

        for (var i = 0; i < notifications_json.length; i++)
        {
            var notification_json = {};
            var notificationAutomation = null;

            try
            {
                notification_json = JSON.parse(notifications_json[i]);

                /*
                 * TODO: need to validate the notification in case someone else has
                 * appened an invalid one (issue #27).
                 */

                var notificationType = notification_json['__meta']['type'] ;

                assert(notificationType in hf_service.notification_interface);

                notificationAutomation = hf_service.notification_interface[notificationType].automation;
            }
            catch (err)
            {
                continue;
            }

            if (notificationAutomation != null)
            {
                assert(hf.is_function(notificationAutomation));

                status = notificationAutomation(notification_json);

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
            notification_json['__meta']['hash'] = hf.generate_hash(
                JSON.stringify(notification_json)
            );

            hf_service.user_private_chunk['notifications'].push(notification_json);
        }

        if (notifications_json.length > 0)
        {
            hf_service.save_user_chunks();
        }

        if (callback)
        {
            callback(true);
        }
    });
}

/*
 * Pulls fresh notifications, processes automated one and stores the remaining
 * into the user's private chunk.
 *
 * @param <callback>: the function called once done
 *      @param <notifcations_list>: the list of notifications
 *      function my_callback(notifcations_list)
 */
hf_service.list_user_notifications = function(callback)
{
    assert(hf.is_function(callback));

    hf_service.pull_fresh_user_notifications(function(success){
        if (!success)
        {
            alert('hf_service.list_user_notifications() failed');
        }

        var notifications = [];
        var callbacks_remaining = hf_service.user_private_chunk['notifications'].length;

        var notifications_json = hf_service.user_private_chunk['notifications'];

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
                        callback(notifications);
                    }
                }
            );
        }

        if (notifications_json.length == 0)
        {
            callback(notifications);
            return;
        }
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

    hf_service.push_notification(user_hash, notification_json, callback);
}
