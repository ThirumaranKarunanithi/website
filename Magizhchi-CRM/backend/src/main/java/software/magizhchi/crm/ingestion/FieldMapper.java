package software.magizhchi.crm.ingestion;

import java.util.List;
import java.util.Map;

/**
 * Resolves name/phone/email out of an arbitrary inbound record using an optional
 * explicit mapping (target -> source key) plus a set of common aliases. All key
 * matching is case-insensitive and ignores spaces/underscores so "Full Name",
 * "full_name" and "fullname" all match.
 */
public final class FieldMapper {

    private static final List<String> NAME_ALIASES =
            List.of("name", "fullname", "full name", "your name", "customer", "lead name", "contact name");
    private static final List<String> PHONE_ALIASES =
            List.of("phone", "phonenumber", "mobile", "mobile number", "contact", "contact number", "whatsapp", "number");
    private static final List<String> EMAIL_ALIASES =
            List.of("email", "emailaddress", "e-mail", "mail", "email id");

    private FieldMapper() {}

    public static String name(Map<String, ?> record, Map<String, String> mapping) {
        return resolve(record, mapping, "name", NAME_ALIASES);
    }

    public static String phone(Map<String, ?> record, Map<String, String> mapping) {
        return resolve(record, mapping, "phone", PHONE_ALIASES);
    }

    public static String email(Map<String, ?> record, Map<String, String> mapping) {
        return resolve(record, mapping, "email", EMAIL_ALIASES);
    }

    private static String resolve(Map<String, ?> record, Map<String, String> mapping,
                                  String target, List<String> aliases) {
        // 1) explicit mapping wins
        if (mapping != null) {
            String src = mapping.get(target);
            if (src != null && !src.isBlank()) {
                String v = lookup(record, src);
                if (v != null) return v;
            }
        }
        // 2) fall back to common aliases
        for (String a : aliases) {
            String v = lookup(record, a);
            if (v != null) return v;
        }
        return null;
    }

    /** Case/space/underscore-insensitive value lookup. */
    private static String lookup(Map<String, ?> record, String wantedKey) {
        String want = normalize(wantedKey);
        for (Map.Entry<String, ?> e : record.entrySet()) {
            if (normalize(e.getKey()).equals(want)) {
                Object val = e.getValue();
                if (val == null) return null;
                String s = String.valueOf(val).trim();
                return s.isEmpty() ? null : s;
            }
        }
        return null;
    }

    private static String normalize(String s) {
        return s == null ? "" : s.toLowerCase().replaceAll("[\\s_\\-]", "");
    }
}
