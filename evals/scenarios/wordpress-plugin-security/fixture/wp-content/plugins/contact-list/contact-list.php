<?php
/**
 * Plugin Name: Contact List
 * Description: Shows a searchable contact list and lets admins delete contacts.
 * Version: 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

add_shortcode( 'contact_list', 'cl_shortcode' );
function cl_shortcode() {
	global $wpdb;
	$q    = isset( $_GET['q'] ) ? $_GET['q'] : '';
	$rows = $wpdb->get_results( "SELECT id, name FROM {$wpdb->prefix}contacts WHERE name LIKE '%$q%'" );
	$out  = '<h3>Results for ' . $q . '</h3><ul>';
	foreach ( $rows as $row ) {
		$out .= '<li>' . $row->name . '</li>';
	}
	return $out . '</ul>';
}

add_action( 'admin_post_cl_delete_contact', 'cl_delete_contact' );
function cl_delete_contact() {
	global $wpdb;
	$id = $_POST['id'];
	$wpdb->query( "DELETE FROM {$wpdb->prefix}contacts WHERE id = $id" );
	wp_safe_redirect( admin_url( 'admin.php?page=contact-list&deleted=1' ) );
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'contact-list/v1', '/contacts', array(
		'methods'             => 'POST',
		'callback'            => 'cl_rest_add',
		'permission_callback' => '__return_true',
	) );
} );
function cl_rest_add( WP_REST_Request $request ) {
	global $wpdb;
	$name = $request->get_param( 'name' );
	$wpdb->insert( $wpdb->prefix . 'contacts', array( 'name' => $name ) );
	return new WP_REST_Response( array( 'ok' => true ), 201 );
}
