package com.magizhchi.dbcommunicator.db.engine;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Builds an index of all {@link DatabaseEngine} beans keyed by display name,
 * and exposes a flat list of every supported type for the TYPE dropdown.
 */
@Component
public class EngineRegistry {

    private final Map<String, DatabaseEngine> byType = new HashMap<>();
    private final List<String> allTypes = new ArrayList<>();

    public EngineRegistry(List<DatabaseEngine> engines) {
        for (DatabaseEngine e : engines) {
            for (String name : e.supportedTypes()) {
                byType.put(name.toLowerCase(Locale.ROOT), e);
                allTypes.add(name);
            }
        }
    }

    public DatabaseEngine resolve(String displayName) {
        if (displayName == null) return null;
        return byType.get(displayName.toLowerCase(Locale.ROOT));
    }

    public List<String> allDisplayNames() {
        return List.copyOf(allTypes);
    }
}
