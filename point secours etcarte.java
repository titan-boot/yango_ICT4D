package com.yango.emergency;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.widget.Button;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.Recorder;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Locale;

public class MediaRecorderActivity extends AppCompatActivity {
    private VideoCapture<Recorder> videoCapture;
    private Button recordButton;
    private boolean recording = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_media_recorder);
        recordButton = findViewById(R.id.record_button);
        
        if (checkPermissions()) startCamera();
        else requestPermissions();
        
        recordButton.setOnClickListener(v -> {
            if (recording) stopRecording();
            else startRecording();
        });
    }
    
    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture = ProcessCameraProvider.getInstance(this);
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(findViewById(R.id.previewView).getSurfaceProvider());
                
                Recorder recorder = new Recorder.Builder().build();
                videoCapture = VideoCapture.withOutput(recorder);
                
                CameraSelector cameraSelector = new CameraSelector.Builder().requireLensFacing(CameraSelector.LENS_FACING_BACK).build();
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, videoCapture);
            } catch (Exception e) { e.printStackTrace(); }
        }, ContextCompat.getMainExecutor(this));
    }
    
    private void startRecording() {
        File outputDir = getExternalFilesDir(Environment.DIRECTORY_MOVIES);
        File videoFile = new File(outputDir, "emergency_" + System.currentTimeMillis() + ".mp4");
        videoCapture.getOutput().prepareRecording(this, videoFile).start(ContextCompat.getMainExecutor(this), recordEvent -> {
            if (recordEvent instanceof VideoRecordEvent.Start) recording = true;
            else if (recordEvent instanceof VideoRecordEvent.Finalize) {
                recording = false;
                uploadVideo(videoFile);
            }
        });
    }
    
    private void uploadVideo(File file) { /* Implémenter l'upload vers Firebase Storage */ }
    private boolean checkPermissions() { /* Vérifier CAMERA et RECORD_AUDIO */ }
    private void requestPermissions() { /* Demander permissions */ }
}
