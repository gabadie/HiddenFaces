
// -------------------------------------------------------- NOTIFICATION SERVICE
/*
 * Contains all notification's automation
 *
 * @param <notification_json>: the received notification
 * function(notification_json)
 * {
 *     // my code
 * }
 */
hf_service.notification_automation = {
    '/notification/message': null,
    '/notification/contact_request': null
};

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
    assert(hf.is_hash(user_hash));
    assert(typeof notification_json['__meta']['type'] == 'string');
    assert(notification_json['__meta']['type'] in hf_service.notification_automation);
    assert(hf.is_hash(notification_json['__meta']['author_user_hash']));
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
                    return;
                }

                callback(true);
            }
        )
    });
}

/*
 * Pulls fresh notifications, processes automated one and stores the remaining
 * into the user's private chunk.
 */
hf_service.pull_fresh_notifications = function()
{
    assert(hf_service.is_connected());

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
        assert(json_message['status'] == 'ok');

        var notifications_json = json_message['chunk'][protected_chunk_name];
        var needChunkSave = false;

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

                assert(notificationType in hf_service.notification_automation);

                notificationAutomation = hf_service.notification_automation[notificationType];
            }
            catch (err)
            {
                continue;
            }

            if (notificationAutomation != null)
            {
                console.into(notificationType);

                assert(hf.is_function(notificationAutomation));

                notificationAutomation(notification_json);

                continue;
            }

            /*
             * We store this notification into the user's private chunk
             */
            needChunkSave = true;

            hf_service.user_private_chunk['notifications'].push(notification_json);
        }

        if (needChunkSave)
        {
            assert(notifications_json.length > 0);
            assert(hf_service.user_private_chunk['notifications'].length > 0);

            hf_service.save_user_chunks();
        }
    });
}


// ------------------------------------------------ NOTIFICATION IMPLEMENTATIONS

/*
 * Send a request to friend
 *
 * @params <user_has>: user's hash
 * @params <message>: message to send to 2nd user
 * @param <callback>: the callback once the notification has been pushed
 *      @param <success>: true or false
 *      function my_callback(success)
 */
hf_service.send_contact_request = function(user_hash, message, callback)
{
    assert(hf_service.is_connected(), "user not connected in hf_service.send_contact_request");
    var my_hash = hf_service.user_hash();

    var notification = {
        '__meta': {
            'type': '/notification/contact_request',
            'author_user_hash': my_hash
        },
        'content': message
    };

    hf_service.push_notification(user_hash, notification, callback);
}
