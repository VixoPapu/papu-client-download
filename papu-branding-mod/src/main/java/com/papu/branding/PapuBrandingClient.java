package com.papu.branding;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.minecraft.client.option.GameOptions;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import org.lwjgl.glfw.GLFW;

import java.lang.reflect.Method;
import java.util.Arrays;

public class PapuBrandingClient implements ClientModInitializer {
    private static boolean wasRightShiftDown = false;
    private static Double previousGamma = null;
    private static Integer previousFov = null;
    private static Method cachedTimeSetter = null;
    private static Method cachedRainSetter = null;
    private static Method cachedThunderSetter = null;

    @Override
    public void onInitializeClient() {
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.getWindow() == null) {
                return;
            }
            long handle = client.getWindow().getHandle();
            boolean rightShiftDown = GLFW.glfwGetKey(handle, GLFW.GLFW_KEY_RIGHT_SHIFT) == GLFW.GLFW_PRESS;
            if (rightShiftDown && !wasRightShiftDown) {
                client.setScreen(new com.papu.branding.screen.PapuModsScreen(client.currentScreen));
            }
            wasRightShiftDown = rightShiftDown;

            applyClientModules(client);
        });
    }

    private static void applyClientModules(net.minecraft.client.MinecraftClient client) {
        GameOptions options = client.options;

        boolean fullbright = com.papu.branding.screen.PapuModsScreen.isModuleEnabled("fullbright");
        if (fullbright) {
            if (previousGamma == null) {
                previousGamma = options.getGamma().getValue();
            }
            // Minecraft 1.21.x only accepts gamma in a limited range.
            options.getGamma().setValue(1.0);
            if (client.player != null) {
                client.player.addStatusEffect(new StatusEffectInstance(StatusEffects.NIGHT_VISION, 220, 0, true, false, false));
            }
        } else if (previousGamma != null) {
            options.getGamma().setValue(previousGamma);
            previousGamma = null;
            if (client.player != null) {
                client.player.removeStatusEffect(StatusEffects.NIGHT_VISION);
            }
        }

        boolean zoomEnabled = com.papu.branding.screen.PapuModsScreen.isModuleEnabled("zoom");
        boolean zoomKeyDown = client.getWindow() != null &&
            GLFW.glfwGetKey(client.getWindow().getHandle(), GLFW.GLFW_KEY_C) == GLFW.GLFW_PRESS;
        if (zoomEnabled && zoomKeyDown) {
            if (previousFov == null) {
                previousFov = options.getFov().getValue();
            }
            options.getFov().setValue(30);
        } else if (previousFov != null) {
            options.getFov().setValue(previousFov);
            previousFov = null;
        }

        if (client.world != null) {
            if (com.papu.branding.screen.PapuModsScreen.isModuleEnabled("time_changer")) {
                invokeTimeSetter(client.world, 6000L);
            }
            if (com.papu.branding.screen.PapuModsScreen.isModuleEnabled("weather_changer")) {
                invokeWeatherSetters(client.world, 0.0F, 0.0F);
            }
        }
    }

    private static void invokeTimeSetter(Object world, long value) {
        try {
            if (cachedTimeSetter == null) {
                cachedTimeSetter = resolveMethod(world.getClass(), long.class,
                    "setTimeOfDay", "setTime", "method_8435", "method_8461");
                if (cachedTimeSetter == null) {
                    cachedTimeSetter = Arrays.stream(world.getClass().getMethods())
                        .filter(m -> m.getParameterCount() == 1)
                        .filter(m -> m.getParameterTypes()[0] == long.class)
                        .filter(m -> m.getReturnType() == void.class)
                        .findFirst()
                        .orElse(null);
                }
            }
            if (cachedTimeSetter != null) {
                cachedTimeSetter.invoke(world, value);
            }
        } catch (Exception ignored) {
        }
    }

    private static void invokeWeatherSetters(Object world, float rainValue, float thunderValue) {
        try {
            if (cachedRainSetter == null || cachedThunderSetter == null) {
                cachedRainSetter = resolveMethod(world.getClass(), float.class,
                    "setRainGradient", "method_15746", "method_8442");
                cachedThunderSetter = resolveMethod(world.getClass(), float.class,
                    "setThunderGradient", "method_15747", "method_8443");

                Method[] floatSetters = Arrays.stream(world.getClass().getMethods())
                    .filter(m -> m.getParameterCount() == 1)
                    .filter(m -> m.getParameterTypes()[0] == float.class)
                    .filter(m -> m.getReturnType() == void.class)
                    .toArray(Method[]::new);
                if (cachedRainSetter == null && floatSetters.length > 0) cachedRainSetter = floatSetters[0];
                if (cachedThunderSetter == null && floatSetters.length > 1) cachedThunderSetter = floatSetters[1];
            }
            if (cachedRainSetter != null) cachedRainSetter.invoke(world, rainValue);
            if (cachedThunderSetter != null) cachedThunderSetter.invoke(world, thunderValue);
        } catch (Exception ignored) {
        }
    }

    private static Method resolveMethod(Class<?> cls, Class<?> argType, String... names) {
        for (String name : names) {
            try {
                return cls.getMethod(name, argType);
            } catch (NoSuchMethodException ignored) {
            }
        }
        return null;
    }
}
