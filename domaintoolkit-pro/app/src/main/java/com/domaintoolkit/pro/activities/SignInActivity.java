package com.domaintoolkit.pro.activities;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.MenuItem;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import com.domaintoolkit.pro.R;
import com.domaintoolkit.pro.models.User;
import com.domaintoolkit.pro.utils.AuthManager;
import com.domaintoolkit.pro.utils.Constants;
import com.domaintoolkit.pro.utils.ThemeManager;
import com.domaintoolkit.pro.utils.UserManager;

/**
 * Sign-in / Register screen with Google (account picker) & Facebook login.
 * Users CHOOSE which Google account to use — not auto-login.
 * Java 7 / AIDE compatible.
 */
public class SignInActivity extends Activity {

    private UserManager mUserManager;
    private ThemeManager mThemeManager;
    private ProgressBar mProgressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        mThemeManager = ThemeManager.getInstance(this);
        mThemeManager.applyTheme(this);
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_signin);

        if (getActionBar() != null) {
            getActionBar().setDisplayHomeAsUpEnabled(true);
            getActionBar().setTitle("Sign In");
        }

        mUserManager = UserManager.getInstance(this);
        mProgressBar = (ProgressBar) findViewById(R.id.signin_progress);

        // Google Sign-In button
        Button btnGoogle = (Button) findViewById(R.id.btn_google_signin);
        if (btnGoogle != null) {
            btnGoogle.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    showProgress(true);
                    AuthManager.startGoogleSignIn(SignInActivity.this, Constants.RC_GOOGLE_SIGN_IN);
                }
            });
        }

        // Facebook Sign-In button
        Button btnFacebook = (Button) findViewById(R.id.btn_facebook_signin);
        if (btnFacebook != null) {
            btnFacebook.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    showProgress(true);
                    AuthManager.startFacebookSignIn(SignInActivity.this);
                }
            });
        }

        // Skip / Continue as Guest
        Button btnSkip = (Button) findViewById(R.id.btn_skip_signin);
        if (btnSkip != null) {
            btnSkip.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    finish();
                }
            });
        }

        // Already signed in?
        if (mUserManager.isLoggedIn()) {
            User user = mUserManager.getCurrentUser();
            TextView statusText = (TextView) findViewById(R.id.signin_status);
            if (statusText != null && user != null) {
                statusText.setText("Signed in as " + user.getDisplayName() +
                        " (" + user.getEmail() + ")");
                statusText.setVisibility(View.VISIBLE);
            }
            Button btnSignOut = (Button) findViewById(R.id.btn_signout);
            if (btnSignOut != null) {
                btnSignOut.setVisibility(View.VISIBLE);
                btnSignOut.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        mUserManager.signOut();
                        Toast.makeText(SignInActivity.this, "Signed out", Toast.LENGTH_SHORT).show();
                        finish();
                    }
                });
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == Constants.RC_GOOGLE_SIGN_IN) {
            showProgress(true);
            AuthManager.handleGoogleResult(this, data, new AuthManager.AuthCallback() {
                @Override
                public void onSuccess(User user) {
                    showProgress(false);
                    mUserManager.saveUser(user);
                    Toast.makeText(SignInActivity.this,
                            "Welcome, " + user.getDisplayName() + "!",
                            Toast.LENGTH_LONG).show();
                    finish();
                }

                @Override
                public void onError(String message) {
                    showProgress(false);
                    Toast.makeText(SignInActivity.this,
                            message, Toast.LENGTH_LONG).show();
                }
            });
        }

        if (requestCode == Constants.RC_FACEBOOK_SIGN_IN) {
            showProgress(true);
            AuthManager.handleFacebookResult(this, requestCode, resultCode, data,
                    new AuthManager.AuthCallback() {
                        @Override
                        public void onSuccess(User user) {
                            showProgress(false);
                            mUserManager.saveUser(user);
                            Toast.makeText(SignInActivity.this,
                                    "Welcome, " + user.getDisplayName() + "!",
                                    Toast.LENGTH_LONG).show();
                            finish();
                        }

                        @Override
                        public void onError(String message) {
                            showProgress(false);
                            Toast.makeText(SignInActivity.this,
                                    message, Toast.LENGTH_LONG).show();
                        }
                    });
        }
    }

    private void showProgress(boolean show) {
        if (mProgressBar != null) {
            mProgressBar.setVisibility(show ? View.VISIBLE : View.GONE);
        }
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == android.R.id.home) {
            finish();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
}
