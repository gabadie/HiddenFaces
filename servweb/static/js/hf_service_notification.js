
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
 *      function my_callback(user_hash, notification_json)
 */
hf_service.push_notification = function(user_hash, notification_json, callback)
{
    assert(hf.is_hash(user_hash));
    assert(typeof notification_json['__meta']['type'] == 'string');
    assert(notification_json['__meta']['type'] in hf_service.notification_automation);
    assert(hf.is_hash(notification_json['__meta']['author_user_hash']));

    // Gets <user_hash>'s public chunk to find <user_hash>'s protected file
    hf_service.get_user_public_chunk(user_hash, function(public_chunk){
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

                if (callback)
                {
                    callback(user_hash, notification_json);
                }
            }
        )
    });
}

/*
 * Send a request to friend
 *  
 * @params <user_has>: user's hash
 * @params <message>: message to send to 2nd user
 * @params <callback>: function to callback
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
