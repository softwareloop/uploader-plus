package com.softwareloop.uploaderplus.log;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.alfresco.util.Pair;
import org.apache.logging.log4j.Level;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.logging.log4j.core.Appender;
import org.apache.logging.log4j.core.appender.FileAppender;
import org.apache.logging.log4j.core.appender.RandomAccessFileAppender;
import org.apache.logging.log4j.core.appender.RollingFileAppender;
import org.apache.logging.log4j.core.appender.RollingRandomAccessFileAppender;
import org.apache.logging.log4j.core.config.Configuration;
import org.apache.logging.log4j.simple.SimpleLogger;
import org.apache.logging.log4j.spi.LoggerContext;
import org.apache.logging.log4j.status.StatusLogger;

/**
 * This log4j helper implementation handles log4j version 2 compatibility for Alfresco Content Services from 7.4
 *
 * @author Axel Faust
 */
public class Log4j2HelperImpl implements Log4jHelper
{

    private static final String FRAGMENT_PATTERN = "%\\d*i|%d\\{[^\\}]+\\}|\\$\\$\\{[^\\}]+\\}";

    private static final org.slf4j.Logger LOGGER = org.slf4j.LoggerFactory.getLogger(Log4j2HelperImpl.class);

    /**
     * {@inheritDoc}
     */
    @Override
    public String getRootLoggerName()
    {
        return LogManager.ROOT_LOGGER_NAME;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setRootLevel(final String level)
    {
        this.setLevel(LogManager.ROOT_LOGGER_NAME, level);
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getRootLevel()
    {
        return LogManager.getRootLogger().getLevel().toString();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void setLevel(final String loggerName, final String level)
    {
        final Logger logger = LogManager.getLogger(loggerName);
        final Level oldLevel = logger.getLevel();
        if (logger instanceof SimpleLogger)
        {
            ((SimpleLogger) logger).setLevel(Level.getLevel(level));
            Log4jCompatibilityUtils.LOG_SETTING_TRACKER.recordChange(logger.getName(), oldLevel != null ? oldLevel.toString() : null,
                    level);
        }
        else if (logger instanceof StatusLogger)
        {
            ((StatusLogger) logger).setLevel(Level.getLevel(level));
            Log4jCompatibilityUtils.LOG_SETTING_TRACKER.recordChange(logger.getName(), oldLevel != null ? oldLevel.toString() : null,
                    level);
        }
        else if (logger instanceof org.apache.logging.log4j.core.Logger)
        {
            ((org.apache.logging.log4j.core.Logger) logger).setLevel(Level.getLevel(level));
            Log4jCompatibilityUtils.LOG_SETTING_TRACKER.recordChange(logger.getName(), oldLevel != null ? oldLevel.toString() : null,
                    level);
        }
        else
        {
            LOGGER.warn("Log4j2 logger type {} does not support runtime configuration of the level", logger.getClass());
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String getLevel(final String loggerName)
    {
        final Level level = LogManager.getLogger(loggerName).getLevel();
        return level != null ? level.toString() : null;
    }

    /**
     *
     * {@inheritDoc}
     */
    @Override
    public LoggerInfo getLogger(final String loggerName)
    {
        final Logger logger = LogManager.getContext().getLoggerRegistry().getLogger(loggerName);
        return logger != null ? this.toLoggerInfo(logger) : null;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<LoggerInfo> getLoggers(final String loggerNamePattern, final boolean showUnconfiguredLoggers)
    {
        String effectiveLoggerNamePattern = loggerNamePattern != null && !loggerNamePattern.isEmpty() ? loggerNamePattern : null;
        if (effectiveLoggerNamePattern != null)
        {
            effectiveLoggerNamePattern = effectiveLoggerNamePattern.replace(".", "\\.").replace("*", ".+");
        }
        final Pattern effectiveLoggerNamePatternP = effectiveLoggerNamePattern != null
                ? Pattern.compile(effectiveLoggerNamePattern, Pattern.CASE_INSENSITIVE)
                : null;

        final List<LoggerInfo> loggers = new ArrayList<>();

        if (effectiveLoggerNamePatternP == null)
        {
            loggers.add(this.toLoggerInfo(LogManager.getRootLogger()));
        }

        final Collection<? extends Logger> currentLoggers = LogManager.getContext().getLoggerRegistry().getLoggers();
        currentLoggers.stream().filter(l -> l.getLevel() != null || showUnconfiguredLoggers)
                .filter(l -> effectiveLoggerNamePatternP == null || effectiveLoggerNamePatternP.matcher(l.getName()).matches())
                .forEach(l -> loggers.add(this.toLoggerInfo(l)));

        return loggers;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Object getAppender(final String appenderName, final String loggerName)
    {
        Object appender = null;
        final LoggerContext context = LogManager.getContext();
        if (context instanceof org.apache.logging.log4j.core.LoggerContext)
        {
            appender = ((org.apache.logging.log4j.core.LoggerContext) context).getConfiguration().getAppender(appenderName);
        }
        return appender;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void validateFilePath(final Collection<String> paths, final Consumer<String> invalidPathConsumer,
            final Consumer<Path> resolvedPathConsumer)
    {
        final LoggerContext context = LogManager.getContext();
        if (context instanceof org.apache.logging.log4j.core.LoggerContext)
        {
            final Configuration configuration = ((org.apache.logging.log4j.core.LoggerContext) context).getConfiguration();
            final Collection<String> procesedPaths = new HashSet<>();
            // decouple before non-trivial iteration on value set
            new ArrayList<>(configuration.getAppenders().values()).forEach(appender -> {
                if (appender instanceof FileAppender || appender instanceof RandomAccessFileAppender)
                {
                    final Path configuredFilePath = this.getSimpleFileAppenderFilePath(appender);

                    paths.stream().filter(s -> !procesedPaths.contains(s)).forEach(s -> {
                        final Path path = Paths.get(s);
                        final boolean validPath = path.startsWith(configuredFilePath.getParent())
                                && nameMatches(path.getFileName().toString(), configuredFilePath.getFileName().toString());

                        if (validPath)
                        {
                            resolvedPathConsumer.accept(path);
                            procesedPaths.add(s);
                        }
                    });
                }
                else if (appender instanceof RollingFileAppender || appender instanceof RollingRandomAccessFileAppender)
                {
                    final Pair<Path, String> basePathAndRollingFile = this.getRollingFileAppenderPath(appender);

                    final Path configuredFilePath = basePathAndRollingFile.getFirst();
                    final String rollingFile = basePathAndRollingFile.getSecond();

                    final boolean simpleRollingFile = this.isSimpleRollingFile(rollingFile);
                    final Path configuredRollingPath = simpleRollingFile ? Paths.get(rollingFile).toAbsolutePath() : null;

                    paths.stream().filter(s -> !procesedPaths.contains(s)).forEach(s -> {
                        final Path path = Paths.get(s);
                        final boolean validPath = (path.startsWith(configuredFilePath.getParent())
                                && nameMatches(path.getFileName().toString(), configuredFilePath.getFileName().toString()))
                                || (configuredRollingPath != null && path.startsWith(configuredRollingPath.getParent())
                                        && nameMatches(path.getFileName().toString(), configuredRollingPath.getFileName().toString()))
                                || (configuredRollingPath == null && pathMatchesRollingPatternPath(path, rollingFile));

                        if (validPath)
                        {
                            resolvedPathConsumer.accept(path);
                            procesedPaths.add(s);
                        }
                    });
                }
            });
        }
        else
        {
            LOGGER.warn("Log4j2 logger context is a {} without access to appenders - unable to validate log file paths",
                    context.getClass());
            paths.forEach(invalidPathConsumer);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<Path> collectLogFilePaths(final boolean useAllLoggerAppenders)
    {
        final Set<Path> paths = new HashSet<>();

        final Consumer<Appender> appenderHandler = appender -> {
            if (appender instanceof FileAppender || appender instanceof RandomAccessFileAppender)
            {
                final Path filePath = this.getSimpleFileAppenderFilePath(appender);
                if (Files.exists(filePath))
                {
                    paths.add(filePath);
                }
            }
            else if (appender instanceof RollingFileAppender || appender instanceof RollingRandomAccessFileAppender)
            {
                final Pair<Path, String> basePathAndRollingFile = this.getRollingFileAppenderPath(appender);

                final Path filePath = basePathAndRollingFile.getFirst();
                if (Files.exists(filePath))
                {
                    paths.add(filePath);
                }

                final String rollingFile = basePathAndRollingFile.getSecond();
                final boolean simpleRollingFile = this.isSimpleRollingFile(rollingFile);
                final Path configuredRollingPath = simpleRollingFile ? Paths.get(rollingFile).toAbsolutePath() : null;
                if (configuredRollingPath != null)
                {
                    try
                    {
                        Files.newDirectoryStream(configuredRollingPath.getParent()).forEach(path -> {
                            if (Files.isRegularFile(path)
                                    && nameMatches(path.getFileName().toString(), configuredRollingPath.getFileName().toString()))
                            {
                                paths.add(path);
                            }
                        });
                    }
                    catch (final IOException ioex)
                    {
                        LOGGER.warn("Failed to collect rolling file log paths from {}", configuredRollingPath, ioex);
                    }
                }
                else
                {
                    LOGGER.info("Not resolving complex rolling file pattern {} to runtime log files", rollingFile);
                }
            }
        };

        final Logger rootLogger = LogManager.getRootLogger();
        if (rootLogger instanceof org.apache.logging.log4j.core.Logger)
        {
            new ArrayList<>(((org.apache.logging.log4j.core.Logger) rootLogger).getAppenders().values()).forEach(appenderHandler);
        }
        if (useAllLoggerAppenders)
        {
            LogManager.getContext().getLoggerRegistry().getLoggers().stream().filter(org.apache.logging.log4j.core.Logger.class::isInstance)
                    .map(org.apache.logging.log4j.core.Logger.class::cast)
                    .forEach(logger -> new ArrayList<>(logger.getAppenders().values()).forEach(appenderHandler));
        }

        final List<Path> sortedPaths = new ArrayList<>(paths);
        Collections.sort(sortedPaths);
        return sortedPaths;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String createTailingAppender()
    {
        final String uuid = UUID.randomUUID().toString();
        final Log4j2LimitedListAppender appender = new Log4j2LimitedListAppender(uuid, 10000);
        appender.registerAsAppender(LogManager.getRootLogger());
        return uuid;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public List<?> retrieveTailingAppenderEvents(final String uuid)
    {
        List<?> events = Collections.emptyList();

        final Logger rootLogger = LogManager.getRootLogger();
        if (rootLogger instanceof org.apache.logging.log4j.core.Logger)
        {
            final Appender appender = ((org.apache.logging.log4j.core.Logger) rootLogger).getAppenders().get(uuid);
            if (appender instanceof Log4j2LimitedListAppender)
            {
                events = ((Log4j2LimitedListAppender) appender).retrieveLogEvents();
            }
        }

        return events;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public String createSnapshotAppender()
    {
        final Log4j2TemporaryFileAppender appender = Log4j2TemporaryFileAppender.createAppender();

        appender.registerAsAppender(LogManager.getRootLogger());
        final LoggerContext context = LogManager.getContext();
        if (context instanceof org.apache.logging.log4j.core.LoggerContext)
        {
            ((org.apache.logging.log4j.core.LoggerContext) context).getLoggers().stream()
                    .filter(org.apache.logging.log4j.core.Logger.class::isInstance).map(org.apache.logging.log4j.core.Logger.class::cast)
                    .filter(logger -> !logger.isAdditive()).forEach(appender::registerAsAppender);
        }

        return appender.getName();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Optional<Path> closeSnapshotAppender(final String uuid)
    {
        Optional<Path> result = Optional.empty();
        final Logger rootLogger = LogManager.getRootLogger();
        if (rootLogger instanceof org.apache.logging.log4j.core.Logger)
        {
            final Appender appender = ((org.apache.logging.log4j.core.Logger) rootLogger).getAppenders().get(uuid);
            if (appender instanceof Log4j2TemporaryFileAppender)
            {
                appender.stop();
                result = Optional.of(Paths.get(((Log4j2TemporaryFileAppender) appender).getFileName()));
            }
        }
        return result;
    }

    private static boolean nameMatches(final String name, final String nameOrRollingPattern)
    {
        // to account for out-of-process rolling / compression (logrotate) we only do prefix match
        boolean matches = true;

        // look for %i/%d{...}/$${...} patterns
        // those are too costly to match so we split and match only the static parts of the pattern
        final Matcher matcher = Pattern.compile(FRAGMENT_PATTERN).matcher(nameOrRollingPattern);
        int patternOffsetIdx = 0;
        int nameOffsetIdx = 0;
        while (matches && matcher.find(patternOffsetIdx))
        {
            final int start = matcher.start();
            final String fragment = nameOrRollingPattern.substring(patternOffsetIdx, start);

            final int fragmentIdx = name.indexOf(fragment, nameOffsetIdx);
            if (fragmentIdx != -1)
            {
                nameOffsetIdx = fragmentIdx + fragment.length();
            }
            else
            {
                matches = false;
            }

            // we skip over the dynamic pattern (too much effort to match precisely)
            patternOffsetIdx = matcher.end();
        }

        if (matches && patternOffsetIdx < nameOrRollingPattern.length())
        {
            final String lastFragment = nameOrRollingPattern.substring(patternOffsetIdx);
            final int fragmentIdx = name.indexOf(lastFragment, nameOffsetIdx);
            matches = fragmentIdx != -1;
        }

        return matches;
    }

    private static boolean pathMatchesRollingPatternPath(final Path path, final String rollingFilePattern)
    {
        boolean matches = true;

        final String rollingFilePatternPath = rollingFilePattern.replace('\\', '/');
        int rollingFilePatternPathOffsetIdx = 0;
        int slashIdx = rollingFilePatternPath.indexOf('/', rollingFilePatternPathOffsetIdx);

        Path basePath;
        if (slashIdx == 0)
        {
            basePath = Paths.get("/");
            rollingFilePatternPathOffsetIdx = slashIdx + 1;
        }
        else if (slashIdx != -1)
        {
            final String basePathFragment = rollingFilePatternPath.substring(0, slashIdx);
            if (basePathFragment.matches(rollingFilePatternPath))
            {
                basePath = Paths.get("t").toAbsolutePath().getParent();
            }
            else
            {
                basePath = Paths.get(basePathFragment).toAbsolutePath();
                rollingFilePatternPathOffsetIdx = slashIdx + 1;
            }
        }
        else
        {
            basePath = Paths.get("t").toAbsolutePath().getParent();
        }
        matches = path.startsWith(basePath);

        if (matches)
        {
            final Path relativePath = path.relativize(basePath);
            slashIdx = rollingFilePatternPath.indexOf('/', rollingFilePatternPathOffsetIdx);
            while (matches && slashIdx != -1)
            {
                if (relativePath.getNameCount() > 1)
                {
                    final Path nextPathEl = relativePath.getName(0);
                    final String fragment = rollingFilePatternPath.substring(rollingFilePatternPathOffsetIdx, slashIdx);
                    if (fragment.matches(rollingFilePatternPath))
                    {
                        final String pattern = fragment.replaceAll("%(0?\\d+)?i", "\\d+").replaceAll(FRAGMENT_PATTERN, ".+");
                        if (nextPathEl.toString().matches("^" + pattern + "$"))
                        {
                            relativePath.relativize(nextPathEl);
                        }
                        else
                        {
                            matches = false;
                        }
                    }
                    else
                    {
                        matches = nextPathEl.toString().equals(fragment);
                        relativePath.relativize(nextPathEl);
                    }
                    rollingFilePatternPathOffsetIdx = slashIdx + 1;
                    slashIdx = rollingFilePatternPath.indexOf('/', rollingFilePatternPathOffsetIdx);
                }
                else
                {
                    matches = false;
                }
            }

            if (matches)
            {
                if (relativePath.getNameCount() > 1)
                {
                    matches = false;
                }
                else
                {
                    final String nameOrRollingPattern = rollingFilePatternPath.substring(rollingFilePatternPathOffsetIdx);
                    matches = nameMatches(relativePath.toString(), nameOrRollingPattern);
                }
            }
        }

        return matches;
    }

    private Path getSimpleFileAppenderFilePath(final Appender appender)
    {
        String appenderFile;
        if (appender instanceof FileAppender)
        {
            appenderFile = ((FileAppender) appender).getFileName();
        }
        else
        {
            appenderFile = ((RandomAccessFileAppender) appender).getFileName();
        }
        final File configuredFile = new File(appenderFile);
        final Path configuredFilePath = configuredFile.toPath().toAbsolutePath();
        return configuredFilePath;
    }

    private Pair<Path, String> getRollingFileAppenderPath(final Appender appender)
    {
        String appenderFile;
        String appenderRollingFile;

        if (appender instanceof RollingFileAppender)
        {
            appenderFile = ((RollingFileAppender) appender).getFileName();
            appenderRollingFile = ((RollingFileAppender) appender).getFilePattern();
        }
        else
        {
            appenderFile = ((RollingRandomAccessFileAppender) appender).getFileName();
            appenderRollingFile = ((RollingRandomAccessFileAppender) appender).getFilePattern();
        }

        final File configuredFile = new File(appenderFile);
        final Path configuredFilePath = configuredFile.toPath().toAbsolutePath();

        return new Pair<>(configuredFilePath, appenderRollingFile);
    }

    private boolean isSimpleRollingFile(final String rollingFile)
    {
        boolean simpleRollingFile = false;
        if (!rollingFile.contains("/"))
        {
            simpleRollingFile = true;
        }
        else
        {
            final int lastSlashIdx = rollingFile.lastIndexOf('/');
            final int lastDollarIdx = rollingFile.lastIndexOf('$');
            final int lastPercentIdx = rollingFile.lastIndexOf('%');
            simpleRollingFile = lastSlashIdx < lastDollarIdx && lastSlashIdx < lastPercentIdx;
        }
        return simpleRollingFile;
    }

    private LoggerInfo toLoggerInfo(final Logger logger)
    {
        boolean isAdditive = false;
        Logger parent = null;
        final Level level = logger.getLevel();
        Level effectiveLevel = level;

        if (logger instanceof org.apache.logging.log4j.core.Logger)
        {
            final org.apache.logging.log4j.core.Logger coreLogger = (org.apache.logging.log4j.core.Logger) logger;
            isAdditive = coreLogger.isAdditive();
            parent = coreLogger.getParent();
            if (effectiveLevel == null)
            {
                effectiveLevel = this.determineEffectiveLevel(coreLogger.getParent());
            }
        }

        final LoggerInfo info = new LoggerInfo(logger.getName(), LogManager.ROOT_LOGGER_NAME.equals(logger.getName()),
                parent != null ? parent.getName() : null, parent != null ? LogManager.ROOT_LOGGER_NAME.equals(parent.getName()) : false,
                level != null ? level.toString() : null, effectiveLevel != null ? effectiveLevel.toString() : null, isAdditive);

        Logger currentLogger = logger;
        while (currentLogger != null)
        {
            if (currentLogger instanceof org.apache.logging.log4j.core.Logger)
            {
                final org.apache.logging.log4j.core.Logger coreLogger = (org.apache.logging.log4j.core.Logger) currentLogger;
                coreLogger.getAppenders().keySet().forEach(info::addAppenderName);
                final boolean additive = coreLogger.isAdditive();
                currentLogger = additive ? coreLogger.getParent() : null;
            }
            else
            {
                currentLogger = null;
            }
        }

        return info;
    }

    private Level determineEffectiveLevel(final org.apache.logging.log4j.core.Logger logger)
    {
        Level level = null;
        if (logger != null)
        {
            level = logger.getLevel();
            if (level == null)
            {
                level = this.determineEffectiveLevel(logger.getParent());
            }
        }
        return level;
    }
}