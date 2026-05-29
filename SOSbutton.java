package com.yango.emergency;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.IBinder;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ImageButton;

public class SOSButtonService extends Service {
    private WindowManager windowManager;
    private View sosView;

    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public void onCreate() {
        super.onCreate();
        windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
        sosView = LayoutInflater.from(this).inflate(R.layout.sos_button_layout, null);
        
        int layoutFlag = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT,
                layoutFlag,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);
        params.gravity = Gravity.TOP | Gravity.START;
        params.x = 0;
        params.y = 100;
        
        windowManager.addView(sosView, params);
        
        ImageButton sosButton = sosView.findViewById(R.id.sos_button);
        sosButton.setOnClickListener(v -> {
            Intent intent = new Intent(getApplicationContext(), EmergencyActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
        });
    }

    @Override
    public void onDestroy() {
        if (sosView != null) windowManager.removeView(sosView);
        super.onDestroy();
    }
}
