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
	$q    = isset( $_GET['q'] ) ? sanitize_text_field( wp_unslash( $_GET['q'] ) ) : '';
	$rows = $wpdb->get_results(
		$wpdb->prepare(
			"SELECT id, name FROM {$wpdb->prefix}contacts WHERE name LIKE %s",
			'%' . $wpdb->esc_like( $q ) . '%'
		)
	);
	$out  = '<h3>Results for ' . esc_html( $q ) . '</h3><ul>';
	foreach ( $rows as $row ) {
		$out .= '<li>' . esc_html( $row->name ) . '</li>';
	}
	return $out . '</ul>';
}

add_action( 'admin_post_cl_delete_contact', 'cl_delete_contact' );
function cl_delete_contact() {
	check_admin_referer( 'cl_delete_contact' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_die( esc_html__( 'Not allowed.', 'contact-list' ), 403 );
	}
	global $wpdb;
	$id = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
	$wpdb->delete( $wpdb->prefix . 'contacts', array( 'id' => $id ), array( '%d' ) );
	wp_safe_redirect( admin_url( 'admin.php?page=contact-list&deleted=1' ) );
	exit;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'contact-list/v1', '/contacts', array(
		'methods'             => 'POST',
		'callback'            => 'cl_rest_add',
		'permission_callback' => function () {
			return current_user_can( 'manage_options' );
		},
		'args'                => array(
			'name' => array(
				'required'          => true,
				'sanitize_callback' => 'sanitize_text_field',
			),
		),
	) );
} );
function cl_rest_add( WP_REST_Request $request ) {
	global $wpdb;
	$name = $request->get_param( 'name' );
	$wpdb->insert( $wpdb->prefix . 'contacts', array( 'name' => $name ), array( '%s' ) );
	return new WP_REST_Response( array( 'ok' => true ), 201 );
}
