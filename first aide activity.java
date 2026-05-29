package com.yango.emergency;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import java.util.Arrays;
import java.util.List;

public class FirstAidGuidesActivity extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_guides);
        RecyclerView recyclerView = findViewById(R.id.guides_recycler);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));
        
        List<Guide> guides = Arrays.asList(
            new Guide("Arrêt cardiaque", "Appuyer fort et rapidement au centre de la poitrine."),
            new Guide("Hémorragie", "Comprimer la plaie avec un tissu propre."),
            new Guide("Étouffement", "Méthode de Heimlich.")
        );
        recyclerView.setAdapter(new GuideAdapter(guides));
    }
}
