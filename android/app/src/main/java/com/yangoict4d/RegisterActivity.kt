package com.yango.client

import android.content.Intent
import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.messaging.FirebaseMessaging

class RegisterActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var etEmail: EditText
    private lateinit var etPassword: EditText
    private lateinit var rgRole: RadioGroup
    private lateinit var btnRegister: Button
    private lateinit var tvLogin: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_register)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()

        etEmail = findViewById(R.id.etEmail)
        etPassword = findViewById(R.id.etPassword)
        rgRole = findViewById(R.id.rgRole)
        btnRegister = findViewById(R.id.btnRegister)
        tvLogin = findViewById(R.id.tvLogin)

        btnRegister.setOnClickListener {
            val email = etEmail.text.toString().trim()
            val pwd = etPassword.text.toString().trim()
            val role = if (rgRole.checkedRadioButtonId == R.id.rbDriver) "driver" else "client"

            if (email.isEmpty() || pwd.isEmpty()) {
                Toast.makeText(this, "Remplissez tous les champs", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            if (pwd.length < 6) {
                Toast.makeText(this, "Mot de passe >= 6 caractères", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            auth.createUserWithEmailAndPassword(email, pwd)
                .addOnSuccessListener { result ->
                    val uid = result.user?.uid ?: return@addOnSuccessListener
                    // Sauvegarde role + token
                    FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
                        val token = task.result ?: ""
                        val user = hashMapOf(
                            "uid" to uid,
                            "email" to email,
                            "role" to role,
                            "fcmToken" to token,
                            "createdAt" to com.google.firebase.Timestamp.now()
                        )
                        db.collection("users").document(uid).set(user)
                            .addOnSuccessListener {
                                Toast.makeText(this, "Inscription OK", Toast.LENGTH_SHORT).show()
                                startActivity(Intent(this, UserProfileActivity::class.java))
                                finish()
                            }
                    }
                }
                .addOnFailureListener {
                    Toast.makeText(this, "Erreur: ${it.message}", Toast.LENGTH_SHORT).show()
                }
        }

        tvLogin.setOnClickListener { finish() }
    }
}
