package com.yango.emergency;

import android.Manifest;
import android.content.pm.PackageManager;
import android.location.Location;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationServices;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class EmergencyActivity extends AppCompatActivity {
    private FusedLocationProviderClient fusedLocationClient;
    private FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_emergency);
        
        db = FirebaseFirestore.getInstance();
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this);
        
        Button btnNearby = findViewById(R.id.btn_nearby_help);
        Button btnGuides = findViewById(R.id.btn_first_aid);
        Button btnRecord = findViewById(R.id.btn_record_media);
        
        btnNearby.setOnClickListener(v -> startActivity(new Intent(this, NearbyHelpPointsActivity.class)));
        btnGuides.setOnClickListener(v -> startActivity(new Intent(this, FirstAidGuidesActivity.class)));
        btnRecord.setOnClickListener(v -> startActivity(new Intent(this, MediaRecorderActivity.class)));
        
        saveEmergencyToFirestore();
    }
    
    private void saveEmergencyToFirestore() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        fusedLocationClient.getLastLocation().addOnSuccessListener(location -> {
            if (location != null) {
                Map<String, Object> emergency = new HashMap<>();
                emergency.put("lat", location.getLatitude());
                emergency.put("lng", location.getLongitude());
                emergency.put("timestamp", System.currentTimeMillis());
                emergency.put("userId", FirebaseAuth.getInstance().getCurrentUser().getUid());
                db.collection("emergencies").add(emergency);
            }
        });
    }
}
