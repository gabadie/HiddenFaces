
test_hf_service.add_contact = function() {
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    hf_service.add_contact(user_hash1, function() {
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash1 should be added into contacts'
        );
        test_utils.assert(
            !(user_hash2 in hf_service.user_private_chunk['contacts']),
            'user_hash2 should not be added into contacts'
        );
    });

    hf_service.add_contact(user_hash2, function() {
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash1 should already be in contacts'
        );
        test_utils.assert(
            user_hash1 in hf_service.user_private_chunk['contacts'],
            'user_hash2 should be added into contacts'
        );
    });

    hf_service.add_contact("blabla", function(data) {
        test_utils.assert(data == false, "blabla is not a hash");
    });

    test_utils.assert_success(5);
}

test_hf_service.is_contact = function()
{
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);
    var user_profile2 = test_hf_service.john_smith_profile(2);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);
    var user_hash2 = hf_service.create_user(user_profile2);

    hf_service.login_user(user_profile0);

    test_utils.assert(hf_service.is_contact(user_hash1) == false, 'user_hash1 should not be a contact');
    test_utils.assert(hf_service.is_contact(user_hash2) == false, 'user_hash2 should not be a contact');

    hf_service.add_contact(user_hash1);

    test_utils.assert(hf_service.is_contact(user_hash1) == true, 'user_hash1 should be a contact');
    test_utils.assert(hf_service.is_contact(user_hash2) == false, 'user_hash2 should be a contact');
}

test_hf_service.list_contacts = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    var user_profile2 = test_hf_service.john_smith_profile(2);
    var user_hash2 = hf_service.create_user(user_profile2);

    //user0 is logged
    hf_service.login_user(user_profile0);

    hf_service.list_contacts(function(data) {
        test_utils.assert(Object.keys(data).length == 0, "there is no contact");
    });

    hf_service.add_contact(user_hash1);
    hf_service.add_contact(user_hash2);

    //construct expected result
    var expected_content = [];
    hf_service.get_user_public_chunk(user_hash1, function() {
        expected_content.push(hf_service.users_public_chunks[user_hash1])
    });

    hf_service.get_user_public_chunk(user_hash2, function() {
        expected_content.push(hf_service.users_public_chunks[user_hash2])
    });

    //actual result
    hf_service.list_contacts(function(data) {
        test_utils.assert(JSON.stringify(expected_content) === JSON.stringify(data), "get all contacts content is ok");
    });

    test_utils.assert_success(2);
}

test_hf_service.send_chunks_infos_to_contacts = function()
{
    //create all users
    var user_profile0 = test_hf_service.john_smith_profile(0);
    var user_profile1 = test_hf_service.john_smith_profile(1);

    var user_hash0 = hf_service.create_user(user_profile0);
    var user_hash1 = hf_service.create_user(user_profile1);

    var chunks_infos = [
        {
            'name': hf.hash('chunk0'),
            'type': '/thread',
            'symetric_key': 'AES\nhello'
        },
        {
            'name': hf.hash('chunk1'),
            'type': '/thread',
            'symetric_key': 'AES\nworld'
        }
    ];

    hf_service.login_user(user_profile1);
    hf_service.add_contact(user_hash0);
    hf_service.disconnect();

    hf_service.login_user(user_profile0);
    hf_service.add_contact(user_hash1);
    hf_service.send_contacts_infos_to_contacts([user_hash1], chunks_infos, function(success){
        test_utils.assert(success == true, 'notification pushed with success')
    });
    hf_service.disconnect();

    hf_service.login_user(user_profile1);
    hf_service.pull_fresh_user_notifications();

    test_utils.assert(
        hf_service.user_private_chunk['contacts'][user_hash0]['threads'].indexOf(chunks_infos[0]['name']) >= 0,
        'chunk0 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.user_private_chunk['contacts'][user_hash0]['threads'].indexOf(chunks_infos[1]['name']) >= 0,
        'chunk1 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_infos[0]['name']) == chunks_infos[0]['symetric_key'],
        'chunk0 should be listed in user 0\'s threads'
    );

    test_utils.assert(
        hf_service.get_encryption_key(hf_service.user_private_chunk, chunks_infos[1]['name']) == chunks_infos[1]['symetric_key'],
        'chunk1 should be listed in user 0\'s threads'
    );

    test_utils.assert_success(5);
}
