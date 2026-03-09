package com.papu.branding.screen;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import net.fabricmc.loader.api.FabricLoader;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.client.gui.widget.TextFieldWidget;
import net.minecraft.text.Text;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

public class PapuModsScreen extends Screen {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FabricLoader.getInstance().getConfigDir().resolve("papuclient-modules.json");

    private static final List<ModuleEntry> MODULES = new ArrayList<>();
    private static String currentFilter = "all";

    private final Screen parent;
    private TextFieldWidget search;

    static {
        if (MODULES.isEmpty()) {
            MODULES.add(new ModuleEntry("fullbright", "Fullbright", "visual", true, false));
            MODULES.add(new ModuleEntry("time_changer", "Time Changer", "visual", true, false));
            MODULES.add(new ModuleEntry("weather_changer", "Weather Changer", "visual", true, false));
            MODULES.add(new ModuleEntry("fps", "FPS", "hud", true, true));
            MODULES.add(new ModuleEntry("cps", "CPS", "pvp", true, true));
            MODULES.add(new ModuleEntry("keystrokes", "Keystrokes", "pvp", true, true));
            MODULES.add(new ModuleEntry("zoom", "Zoom", "visual", true, true));
            MODULES.add(new ModuleEntry("coordinates", "Coordinates", "hud", true, true));
            MODULES.add(new ModuleEntry("clock", "Clock", "hud", false, true));
            MODULES.add(new ModuleEntry("armor", "Armor Status", "hud", true, true));
            MODULES.add(new ModuleEntry("waypoints", "Waypoints", "visual", false, false));
            MODULES.add(new ModuleEntry("togglesprint", "Toggle Sneak/Sprint", "pvp", true, true));
            MODULES.add(new ModuleEntry("animations", "Animations", "visual", false, false));
            MODULES.add(new ModuleEntry("chat", "Chat", "hud", false, true));
            MODULES.add(new ModuleEntry("blockoverlay", "Block Overlay", "visual", false, false));
            MODULES.add(new ModuleEntry("crosshair", "Crosshair", "visual", true, true));
            MODULES.add(new ModuleEntry("effects", "Effects", "hud", false, false));
            loadState();
        }
    }

    public PapuModsScreen(Screen parent) {
        super(Text.literal("PapuClient Mods"));
        this.parent = parent;
    }

    public static boolean isModuleEnabled(String id) {
        for (ModuleEntry m : MODULES) {
            if (m.id.equals(id)) return m.enabled;
        }
        return false;
    }

    @Override
    protected void init() {
        this.clearChildren();

        int panelX = 4;
        int panelY = 4;
        int panelW = this.width - 8;
        int panelH = this.height - 8;

        int topY = panelY + 10;
        int tabsX = panelX + 16;

        this.addDrawableChild(ButtonWidget.builder(Text.literal("BADLION CLIENT"), b -> {
        }).dimensions(tabsX, topY, 170, 22).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Mods"), b -> {
        }).dimensions(tabsX + 184, topY, 100, 22).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Settings"), b -> {
        }).dimensions(tabsX + 290, topY, 100, 22).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Profiles"), b -> {
        }).dimensions(tabsX + 396, topY, 100, 22).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Premium"), b -> {
        }).dimensions(tabsX + 502, topY, 100, 22).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("|||"), b -> {
        }).dimensions(panelX + panelW - 260, topY, 36, 22).build());

        this.search = new TextFieldWidget(this.textRenderer, panelX + panelW - 218, topY, 172, 22, Text.literal("Search"));
        this.search.setPlaceholder(Text.literal("Search..."));
        this.search.setChangedListener(v -> refreshWidgets());
        this.addDrawableChild(this.search);

        this.addDrawableChild(ButtonWidget.builder(Text.literal("X"), b -> close())
            .dimensions(panelX + panelW - 34, topY, 20, 22)
            .build());

        int leftX = panelX + 16;
        int leftY = panelY + 44;
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Filter"), b -> {
        }).dimensions(leftX, leftY, 130, 20).build());
        addFilterButton("All", "all", leftX, leftY + 24);
        addFilterButton("Popular", "popular", leftX, leftY + 48);
        addFilterButton("PvP", "pvp", leftX, leftY + 72);
        addFilterButton("Hypixel", "hypixel", leftX, leftY + 96);
        addFilterButton("Visual", "visual", leftX, leftY + 120);
        addFilterButton("HUD", "hud", leftX, leftY + 144);

        this.addDrawableChild(ButtonWidget.builder(Text.literal("Favorites"), b -> {
        }).dimensions(panelX + 216, leftY, 96, 20).build());
        this.addDrawableChild(ButtonWidget.builder(Text.literal("Default"), b -> {
        }).dimensions(panelX + 316, leftY, 96, 20).build());

        renderModuleButtons(panelX, panelY, panelW, panelH);
    }

    private void addFilterButton(String text, String value, int x, int y) {
        this.addDrawableChild(ButtonWidget.builder(Text.literal(text), b -> {
            currentFilter = value;
            refreshWidgets();
        }).dimensions(x, y, 160, 20).build());
    }

    private void refreshWidgets() {
        init();
    }

    private void renderModuleButtons(int panelX, int panelY, int panelW, int panelH) {
        int gridX = panelX + 196;
        int gridY = panelY + 70;
        int rightPadding = 16;
        int availableW = panelW - (gridX - panelX) - rightPadding;

        int cardW = 140;
        int cardH = 102;
        int gap = 8;
        int cols = Math.max(1, availableW / (cardW + gap));

        String term = this.search == null ? "" : this.search.getText().trim().toLowerCase(Locale.ROOT);
        List<ModuleEntry> filtered = MODULES.stream()
            .filter(this::moduleMatchesFilter)
            .filter(m -> term.isEmpty() || m.name.toLowerCase(Locale.ROOT).contains(term))
            .sorted(Comparator.comparing(m -> m.name))
            .toList();

        int i = 0;
        int maxRows = Math.max(1, (panelH - 84) / (cardH + gap));
        int maxCards = cols * maxRows;

        for (ModuleEntry mod : filtered) {
            if (i >= maxCards) break;
            int col = i % cols;
            int row = i / cols;
            int x = gridX + col * (cardW + gap);
            int y = gridY + row * (cardH + gap);

            this.addDrawableChild(ButtonWidget.builder(Text.literal(mod.name), b -> {
            }).dimensions(x + 6, y + 6, cardW - 12, 18).build());

            this.addDrawableChild(ButtonWidget.builder(Text.literal("ICON"), b -> {
            }).dimensions(x + 50, y + 30, 40, 24).build());

            this.addDrawableChild(ButtonWidget.builder(Text.literal(mod.category.toUpperCase(Locale.ROOT)), b -> {
            }).dimensions(x + 6, y + 58, 72, 18).build());

            String stateLabel = mod.enabled ? " ON " : "OFF";
            this.addDrawableChild(ButtonWidget.builder(Text.literal(stateLabel), b -> {
                mod.enabled = !mod.enabled;
                saveState();
                refreshWidgets();
            }).dimensions(x + 82, y + 58, 52, 18).build());

            this.addDrawableChild(ButtonWidget.builder(Text.literal(mod.favorite ? "*" : "+"), b -> {
                mod.favorite = !mod.favorite;
                saveState();
                refreshWidgets();
            }).dimensions(x + cardW - 24, y + 8, 18, 18).build());

            i++;
        }
    }

    private boolean moduleMatchesFilter(ModuleEntry m) {
        return switch (currentFilter) {
            case "popular" -> m.popular;
            case "hypixel" -> m.category.equals("pvp") || m.category.equals("visual");
            case "pvp", "visual", "hud" -> m.category.equals(currentFilter);
            default -> true;
        };
    }

    @Override
    public void render(DrawContext context, int mouseX, int mouseY, float delta) {
        int panelX = 4;
        int panelY = 4;
        int panelW = this.width - 8;
        int panelH = this.height - 8;

        context.fill(0, 0, this.width, this.height, 0x901B2845);
        context.fill(panelX, panelY, panelX + panelW, panelY + panelH, 0xE04F6387);
        context.fill(panelX + 1, panelY + 1, panelX + panelW - 1, panelY + 36, 0xFF617CAD);
        context.fill(panelX + 10, panelY + 42, panelX + 180, panelY + panelH - 10, 0xCC44597D);
        context.fill(panelX + 190, panelY + 42, panelX + panelW - 10, panelY + panelH - 10, 0x6B445E85);

        drawModuleCards(context, panelX, panelY, panelW, panelH);
        super.render(context, mouseX, mouseY, delta);
    }

    private void drawModuleCards(DrawContext context, int panelX, int panelY, int panelW, int panelH) {
        int gridX = panelX + 196;
        int gridY = panelY + 70;
        int rightPadding = 16;
        int availableW = panelW - (gridX - panelX) - rightPadding;

        int cardW = 140;
        int cardH = 102;
        int gap = 8;
        int cols = Math.max(1, availableW / (cardW + gap));

        String term = this.search == null ? "" : this.search.getText().trim().toLowerCase(Locale.ROOT);
        List<ModuleEntry> filtered = MODULES.stream()
            .filter(this::moduleMatchesFilter)
            .filter(m -> term.isEmpty() || m.name.toLowerCase(Locale.ROOT).contains(term))
            .sorted(Comparator.comparing(m -> m.name))
            .toList();

        int i = 0;
        int maxRows = Math.max(1, (panelH - 84) / (cardH + gap));
        int maxCards = cols * maxRows;

        for (ModuleEntry mod : filtered) {
            if (i >= maxCards) break;
            int col = i % cols;
            int row = i / cols;
            int x = gridX + col * (cardW + gap);
            int y = gridY + row * (cardH + gap);

            context.fill(x, y, x + cardW, y + cardH, 0xCC556D95);
            context.fill(x + 1, y + 1, x + cardW - 1, y + 24, 0xAA627FAF);
            context.fill(x + 1, y + 56, x + cardW - 1, y + cardH - 1, 0xAA4B6087);

            int pillColor = mod.enabled ? 0xFF3EC7EA : 0xFF3E4D68;
            context.fill(x + 84, y + 60, x + 132, y + 74, pillColor);
            i++;
        }
    }

    @Override
    public boolean shouldPause() {
        return false;
    }

    @Override
    public void close() {
        if (this.client != null) {
            this.client.setScreen(parent);
        }
    }

    private static void saveState() {
        JsonObject root = new JsonObject();
        for (ModuleEntry mod : MODULES) {
            JsonObject m = new JsonObject();
            m.addProperty("enabled", mod.enabled);
            m.addProperty("favorite", mod.favorite);
            m.addProperty("category", mod.category);
            root.add(mod.id, m);
        }
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            Files.writeString(CONFIG_PATH, GSON.toJson(root));
        } catch (IOException ignored) {
        }
    }

    private static void loadState() {
        if (!Files.exists(CONFIG_PATH)) return;
        try {
            JsonObject root = GSON.fromJson(Files.readString(CONFIG_PATH), JsonObject.class);
            if (root == null) return;
            for (ModuleEntry mod : MODULES) {
                JsonElement e = root.get(mod.id);
                if (e == null || !e.isJsonObject()) continue;
                JsonObject o = e.getAsJsonObject();
                if (o.has("enabled")) mod.enabled = o.get("enabled").getAsBoolean();
                if (o.has("favorite")) mod.favorite = o.get("favorite").getAsBoolean();
            }
        } catch (Exception ignored) {
        }
    }

    private static class ModuleEntry {
        final String id;
        final String name;
        final String category;
        final boolean popular;
        boolean enabled;
        boolean favorite;

        ModuleEntry(String id, String name, String category, boolean popular, boolean enabled) {
            this.id = id;
            this.name = name;
            this.category = category;
            this.popular = popular;
            this.enabled = enabled;
            this.favorite = false;
        }
    }
}
