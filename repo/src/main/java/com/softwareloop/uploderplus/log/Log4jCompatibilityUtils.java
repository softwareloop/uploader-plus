package com.softwareloop.uploaderplus.log;

import java.util.HashMap;
import java.util.Map;
import java.util.Map.Entry;

import org.alfresco.util.EqualsHelper;

/**
 * This class provides consolidated access to utility objects / methods that help bridge the gap between ACS 7.3/7.4 and the different Log4J
 * framework versions used therein.
 *
 * @author Axel Faust
 */
public class Log4jCompatibilityUtils
{

    public static final Log4jHelper LOG4J_HELPER;

    /**
     * Resets all logger levels to their previous defaults.
     */
    public static void resetToDefault()
    {
        LOG_SETTING_TRACKER.resetToDefault();
    }

    /**
     * Resets a specific logger's level to the previous default.
     *
     * @param loggerName
     *     the name of the logger
     */
    public static void resetToDefault(final String loggerName)
    {
        LOG_SETTING_TRACKER.resetToDefault(loggerName);
    }

    /**
     * Checks whether a specific logger's level can be reset to the previous default.
     *
     * @param loggerName
     *     the name of the logger
     * @return {@code true} if the level can be reset, {@code false} otherwise
     */
    public static boolean canBeReset(final String loggerName)
    {
        return LOG_SETTING_TRACKER.canBeReset(loggerName);
    }

    protected static final LogSettingTracker LOG_SETTING_TRACKER = new LogSettingTracker();

    static
    {
        Log4jHelper helper;
        try
        {
            Class.forName("org.apache.log4j.Logger");
            helper = new Log4j1HelperImpl();
        }
        catch (final ClassNotFoundException cnfe)
        {
            helper = new Log4j2HelperImpl();
        }
        LOG4J_HELPER = helper;
    }

    protected static final class LogSettingTracker
    {

        private LogSettingTracker()
        {
            // non-constructible
        }

        private final Map<String, String> originalLevels = new HashMap<>();

        public synchronized void recordChange(final String loggerName, final String oldLevel, final String newLevel)
        {
            this.originalLevels.computeIfAbsent(loggerName, l -> oldLevel);
        }

        public synchronized boolean canBeReset(final String loggerName)
        {
            boolean canBeReset = false;
            if (this.originalLevels.containsKey(loggerName))
            {
                final String level = Log4jCompatibilityUtils.LOG4J_HELPER.getLevel(loggerName);
                canBeReset = !EqualsHelper.nullSafeEquals(level, this.originalLevels.get(loggerName));
            }

            return canBeReset;
        }

        public synchronized void resetToDefault()
        {
            for (final Entry<String, String> entry : this.originalLevels.entrySet())
            {
                Log4jCompatibilityUtils.LOG4J_HELPER.setLevel(entry.getKey(), entry.getValue());
            }

            this.originalLevels.clear();
        }

        public synchronized void resetToDefault(final String loggerName)
        {
            if (this.originalLevels.containsKey(loggerName))
            {
                final String originalLevel = this.originalLevels.get(loggerName);
                Log4jCompatibilityUtils.LOG4J_HELPER.setLevel(loggerName, originalLevel);
                this.originalLevels.remove(loggerName);
            }
        }
    }

    private Log4jCompatibilityUtils()
    {
        // non-constructible
    }
}
