
hf_service.define_notification('/notification/testing/manual', {
    automation: null,
    resolve: hf_service.resolve_notification_author
});


test_hf_service.push_notification = function()
{
    var user_profile0 = test_hf_service.john_smith_profile();
    var user_hash0 = hf_service.create_user(user_profile0);

    hf_service.login_user(user_profile0);

    var notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': hf_service.user_hash()
        },
        'content': 'Hi John! How are you?'
    };

    hf_service.get_user_public_chunk(user_hash0, function(user_public_chunk){
        hf_com.get_data_chunk(
            user_public_chunk['system']['protected_chunk']['name'],
            '',
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 0);
            }
        );

        hf_service.push_notification(user_hash0, notification, function(success){
            test_utils.assert(success == true, 'notification push with success')
        });

        hf_com.get_data_chunk(
            user_public_chunk['system']['protected_chunk']['name'],
            '',
            function(json_message){
                test_utils.assert(json_message['chunk_content'].length == 1);
            }
        );
    });

    test_utils.assert_success(3);
}

test_hf_service.notification_automation_util = function(send_notification_callback)
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    var assert_count = send_notification_callback(user_hash1);

    hf_service.disconnect();
    hf_service.login_user(user_profile1);

    hf_com.get_data_chunk(
        hf_service.user_public_chunk()['system']['protected_chunk']['name'],
        '',
        function(json_message){
            test_utils.assert(
                json_message['chunk_content'].length > 0,
                'looks like the notification has not been sent to user_profile1'
            );
        }
    );

    test_utils.assert_success(1);

    hf_service.pull_fresh_notifications();

    test_utils.assert_success(assert_count);

    hf_com.get_data_chunk(
        hf_service.user_public_chunk()['system']['protected_chunk']['name'],
        '',
        function(json_message){
            test_utils.assert(
                json_message['chunk_content'].length == 0,
                'hf_service.pull_fresh_notifications() failed should clean the protected chunk'
            );
        }
    );

    test_utils.assert(
        hf_service.user_private_chunk['notifications'].length == 0,
        'hf_service.pull_fresh_notifications() should not modify the user\'s private chunk'
    );

    test_utils.assert_success(2);
}

test_hf_service.notification_automation_sanity = function()
{
    test_hf_service.notification_automation_util(function(user_hash){
        var original_notification = {
            '__meta': {
                'type': '/notification/testing/automated',
                'author_user_hash': hf_service.user_hash()
            }
        };

        hf_service.define_notification('/notification/testing/automated', {
            automation: function(notification_json) {
                test_utils.assert(
                    notification_json['__meta']['type'] == '/notification/testing/automated',
                    'corrupted notification type'
                );
                test_utils.assert(
                    notification_json['__meta']['author_user_hash'] == original_notification['__meta']['author_user_hash'],
                    'corrupted notification author'
                );

                return 'discard';
            },
            resolve: null
        });

        hf_service.push_notification(user_hash, original_notification, function(success){
            test_utils.assert(success == true, 'notification push with success')
        });

        test_utils.assert_success(1);

        return 2;
    });
}

test_hf_service.list_user_notifications = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_hash0 = hf_service.create_user(user_profile0);

    var original_notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': user_hash0
        }
    };

    hf_service.login_user(user_profile0);

    hf_service.list_user_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 0, 'should not have any notifications');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push a testing notification');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push another testing notification');
    });

    hf_service.list_user_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 2, 'should have two notifications');
        test_utils.assert('author' in notifications_list[0], 'should have author resolved');
        test_utils.assert(
            hf.is_hash(notifications_list[0]['__meta']['hash']),
            'notification[\'__meta\'][\'hash\'] should be a hash'
        );
    });

    test_utils.assert_success(6);
}

test_hf_service.delete_notification = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_hash0 = hf_service.create_user(user_profile0);

    var original_notification = {
        '__meta': {
            'type': '/notification/testing/manual',
            'author_user_hash': user_hash0
        }
    };

    hf_service.login_user(user_profile0);

    hf_service.delete_notification(hf.generate_hash(''), function(success){
        test_utils.assert(success == false, 'deleting a non existing notification should fail');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push a testing notification');
    });

    hf_service.push_notification(user_hash0, original_notification, function(success){
        test_utils.assert(success == true, 'should push another testing notification');
    });

    hf_service.list_user_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 2, 'should have two notifications');

        hf_service.delete_notification(notifications_list[0]['__meta']['hash'], function(success){
            test_utils.assert(success == true, 'deleting existing notification should success');
        });
    });

    hf_service.list_user_notifications(function(notifications_list){
        test_utils.assert(notifications_list.length == 1, 'should have one notification');
    });

    test_utils.assert_success(6);
}

test_hf_service.send_message = function()
{
    var message = 'hello, could you add me as friend, DDD';
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    hf_service.login_user(user_profile0);

    hf_service.send_message(user_hash1, message, function(success) {
        test_utils.assert(success == true, "sent message must have successed");
    });

    hf_service.send_message(user_hash0, message, function(success) {
        test_utils.assert(success == false, "sent message must have failed");
    });

    test_utils.assert_success(2);
}
