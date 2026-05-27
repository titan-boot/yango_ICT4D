package com.yango.client

import android.os.Bundle
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore

class UserProfileActivity : AppCompatActivity() {

    private lateinit var auth: FirebaseAuth
    private lateinit var db: FirebaseFirestore
    private lateinit var tvEmail: TextView
    private lateinit var tvRole: TextView
    private lateinit var btnLogout: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        auth = FirebaseAuth.getInstance()
        db = FirebaseFirestore.getInstance()
        tvEmail = findViewById(R.id.tvEmail)
        tvRole = findViewById(R.id.tvRole)
        btnLogout = findViewById(R.id.btnLogout)

        val user = auth.currentUser
        if (user == null) {
            startActivity(android.content.Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        tvEmail.text = user.email
        db.collection("users").document(user.uid).get()
            .addOnSuccessListener { doc ->
                val role = doc.getString("role") ?: "client"
                tvRole.text = if (role == "driver") "Chauffeur" else "Client"
            }

        btnLogout.setOnClickListener {
            auth.signOut()
            startActivity(android.content.Intent(this, LoginActivity::class.java))
            finish()
        }
    }
}
